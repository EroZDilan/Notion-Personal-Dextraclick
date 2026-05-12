using Microsoft.EntityFrameworkCore;
using NotionClon.Core.DTOs;
using NotionClon.Core.Entities;
using NotionClon.Core.Interfaces;
using NotionClon.Infrastructure.Data;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace NotionClon.Infrastructure.Services;

public class PaginaService : IPaginaService
{
    private readonly AppDbContext _context;

    public PaginaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PaginaDto>> ObtenerArbolAsync(string usuarioId)
    {
        var paginas = await _context.Paginas
            .Where(p => p.UsuarioId == usuarioId && !p.Archivada)
            .Include(p => p.SubPaginas.Where(s => !s.Archivada))
            .OrderBy(p => p.CreadaEn)
            .ToListAsync();

        var raices = paginas.Where(p => p.PaginaPadreId == null).ToList();
        return raices.Select(MapearDto).ToList();
    }

    public async Task<PaginaConBloquesDto> ObtenerConBloquesAsync(Guid id, string usuarioId)
    {
        var pagina = await _context.Paginas
            .Include(p => p.Bloques.OrderBy(b => b.Orden))
            .Include(p => p.SubPaginas.Where(s => !s.Archivada))
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId && !p.Archivada)
            ?? throw new KeyNotFoundException("Página no encontrada");

        return new PaginaConBloquesDto
        {
            Id = pagina.Id,
            Titulo = pagina.Titulo,
            Emoji = pagina.Emoji,
            PaginaPadreId = pagina.PaginaPadreId,
            Bloques = pagina.Bloques.Select(b => new BloqueDto
            {
                Id = b.Id,
                Tipo = b.Tipo.ToString(),
                Contenido = JsonSerializer.Deserialize<object>(b.ContenidoJson)!,
                Orden = b.Orden
            }).ToList(),
            SubPaginas = pagina.SubPaginas.Select(MapearDto).ToList()
        };
    }

    public async Task<PaginaDto> CrearAsync(string usuarioId, Guid? padreId = null)
    {
        var pagina = new Pagina
        {
            UsuarioId = usuarioId,
            PaginaPadreId = padreId
        };

        pagina.Bloques.Add(new Bloque
        {
            Tipo = TipoBloque.Parrafo,
            ContenidoJson = "{\"texto\":\"\"}",
            Orden = 0
        });

        _context.Paginas.Add(pagina);
        await _context.SaveChangesAsync();
        return MapearDto(pagina);
    }

    public async Task ActualizarTituloAsync(Guid id, ActualizarTituloDto dto, string usuarioId)
    {
        var pagina = await _context.Paginas
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Página no encontrada");

        pagina.Titulo = dto.Titulo;
        if (!string.IsNullOrWhiteSpace(dto.Emoji))
            pagina.Emoji = dto.Emoji;
        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task ArchivarAsync(Guid id, string usuarioId)
    {
        var pagina = await _context.Paginas
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Página no encontrada");

        pagina.Archivada = true;
        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task RestaurarAsync(Guid id, string usuarioId)
    {
        var pagina = await _context.Paginas
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Página no encontrada");

        pagina.Archivada = false;
        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<List<PaginaDto>> ObtenerPapeleraAsync(string usuarioId)
    {
        var paginas = await _context.Paginas
            .Where(p => p.UsuarioId == usuarioId && p.Archivada)
            .OrderByDescending(p => p.ActualizadaEn)
            .ToListAsync();

        return paginas.Select(p => new PaginaDto
        {
            Id = p.Id,
            Titulo = p.Titulo,
            Emoji = p.Emoji,
            PaginaPadreId = p.PaginaPadreId,
            ActualizadaEn = p.ActualizadaEn
        }).ToList();
    }

    public async Task<List<ResultadoBusquedaDto>> BuscarAsync(string query, string usuarioId)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2)
            return [];

        var q = query.ToLower();
        var resultados = new List<ResultadoBusquedaDto>();

        // Buscar en títulos
        var porTitulo = await _context.Paginas
            .Where(p => p.UsuarioId == usuarioId && !p.Archivada && p.Titulo.ToLower().Contains(q))
            .Take(5)
            .ToListAsync();

        resultados.AddRange(porTitulo.Select(p => new ResultadoBusquedaDto
        {
            PaginaId = p.Id,
            Titulo = p.Titulo,
            Emoji = p.Emoji,
            Tipo = "pagina"
        }));

        // Buscar en contenido de bloques
        var porContenido = await _context.Bloques
            .Include(b => b.Pagina)
            .Where(b => b.Pagina.UsuarioId == usuarioId && !b.Pagina.Archivada
                     && b.ContenidoJson.ToLower().Contains(q))
            .Take(8)
            .ToListAsync();

        var idsYaIncluidos = resultados.Select(r => r.PaginaId).ToHashSet();

        foreach (var bloque in porContenido)
        {
            if (idsYaIncluidos.Contains(bloque.PaginaId)) continue;

            var textoPlano = ExtraerTexto(bloque.ContenidoJson);
            if (!textoPlano.ToLower().Contains(q)) continue;

            var idx = textoPlano.ToLower().IndexOf(q);
            var inicio = Math.Max(0, idx - 30);
            var fragmento = (inicio > 0 ? "..." : "") + textoPlano.Substring(inicio, Math.Min(80, textoPlano.Length - inicio));

            resultados.Add(new ResultadoBusquedaDto
            {
                PaginaId = bloque.PaginaId,
                Titulo = bloque.Pagina.Titulo,
                Emoji = bloque.Pagina.Emoji,
                Fragmento = fragmento,
                Tipo = "bloque"
            });
            idsYaIncluidos.Add(bloque.PaginaId);
        }

        return resultados.Take(10).ToList();
    }

    private static string ExtraerTexto(string json)
    {
        try
        {
            var doc = JsonSerializer.Deserialize<JsonElement>(json);
            if (doc.TryGetProperty("texto", out var texto))
                return Regex.Replace(texto.GetString() ?? "", "<[^>]+>", "");
            if (doc.TryGetProperty("codigo", out var codigo))
                return codigo.GetString() ?? "";
        }
        catch { }
        return string.Empty;
    }

    private PaginaDto MapearDto(Pagina p) => new()
    {
        Id = p.Id,
        Titulo = p.Titulo,
        Emoji = p.Emoji,
        PaginaPadreId = p.PaginaPadreId,
        ActualizadaEn = p.ActualizadaEn,
        SubPaginas = p.SubPaginas.Where(s => !s.Archivada).Select(MapearDto).ToList()
    };
}
