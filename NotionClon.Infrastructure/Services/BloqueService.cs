using Microsoft.EntityFrameworkCore;
using NotionClon.Core.DTOs;
using NotionClon.Core.Entities;
using NotionClon.Core.Interfaces;
using NotionClon.Infrastructure.Data;

namespace NotionClon.Infrastructure.Services;

public class BloqueService : IBloqueService
{
    private readonly AppDbContext _context;

    public BloqueService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<BloqueDto> CrearBloqueAsync(CrearBloqueDto dto, string usuarioId)
    {
        var pagina = await _context.Paginas
            .FirstOrDefaultAsync(p => p.Id == dto.PaginaId && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Página no encontrada");

        var tipo = Enum.Parse<TipoBloque>(dto.Tipo);

        var bloquesDesplazar = await _context.Bloques
            .Where(b => b.PaginaId == dto.PaginaId && b.Orden >= dto.Orden)
            .ToListAsync();

        foreach (var b in bloquesDesplazar)
            b.Orden++;

        var nuevo = new Bloque
        {
            PaginaId = dto.PaginaId,
            Tipo = tipo,
            ContenidoJson = ContenidoPorDefecto(tipo),
            Orden = dto.Orden
        };

        _context.Bloques.Add(nuevo);
        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return new BloqueDto
        {
            Id = nuevo.Id,
            Tipo = nuevo.Tipo.ToString(),
            Contenido = System.Text.Json.JsonSerializer.Deserialize<object>(nuevo.ContenidoJson)!,
            Orden = nuevo.Orden,
            TotalComentarios = 0
        };
    }

    public async Task ActualizarContenidoAsync(Guid bloqueId, object contenido, string usuarioId)
    {
        var bloque = await _context.Bloques
            .Include(b => b.Pagina)
            .FirstOrDefaultAsync(b => b.Id == bloqueId && b.Pagina.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Bloque no encontrado");

        // Guardar versión anterior (máx 20 por bloque)
        var totalVersiones = await _context.VersionesBloque.CountAsync(v => v.BloqueId == bloqueId);
        if (totalVersiones >= 20)
        {
            var masAntigua = await _context.VersionesBloque
                .Where(v => v.BloqueId == bloqueId)
                .OrderBy(v => v.CreadaEn)
                .FirstAsync();
            _context.VersionesBloque.Remove(masAntigua);
        }

        _context.VersionesBloque.Add(new VersionBloque
        {
            BloqueId = bloqueId,
            ContenidoJson = bloque.ContenidoJson,
            TipoStr = bloque.Tipo.ToString()
        });

        bloque.ContenidoJson = System.Text.Json.JsonSerializer.Serialize(contenido);
        bloque.ActualizadoEn = DateTime.UtcNow;
        bloque.Pagina.ActualizadaEn = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task ReordenarBloquesAsync(Guid paginaId, List<Guid> ordenIds, string usuarioId)
    {
        var pagina = await _context.Paginas
            .Include(p => p.Bloques)
            .FirstOrDefaultAsync(p => p.Id == paginaId && p.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Página no encontrada");

        for (int i = 0; i < ordenIds.Count; i++)
        {
            var bloque = pagina.Bloques.FirstOrDefault(b => b.Id == ordenIds[i]);
            if (bloque != null)
                bloque.Orden = i;
        }

        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task EliminarBloqueAsync(Guid bloqueId, string usuarioId)
    {
        var bloque = await _context.Bloques
            .Include(b => b.Pagina)
            .FirstOrDefaultAsync(b => b.Id == bloqueId && b.Pagina.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Bloque no encontrado");

        _context.Bloques.Remove(bloque);
        bloque.Pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    public async Task<List<VersionBloqueDto>> ObtenerVersionesAsync(Guid bloqueId, string usuarioId)
    {
        var existe = await _context.Bloques
            .AnyAsync(b => b.Id == bloqueId && b.Pagina.UsuarioId == usuarioId);

        if (!existe) throw new KeyNotFoundException("Bloque no encontrado");

        return await _context.VersionesBloque
            .Where(v => v.BloqueId == bloqueId)
            .OrderByDescending(v => v.CreadaEn)
            .Select(v => new VersionBloqueDto
            {
                Id = v.Id,
                ContenidoJson = v.ContenidoJson,
                TipoStr = v.TipoStr,
                CreadaEn = v.CreadaEn
            })
            .ToListAsync();
    }

    public async Task RestaurarVersionAsync(Guid versionId, string usuarioId)
    {
        var version = await _context.VersionesBloque
            .Include(v => v.Bloque).ThenInclude(b => b.Pagina)
            .FirstOrDefaultAsync(v => v.Id == versionId && v.Bloque.Pagina.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Versión no encontrada");

        var bloque = version.Bloque;

        // Guardar estado actual como nueva versión antes de restaurar
        _context.VersionesBloque.Add(new VersionBloque
        {
            BloqueId = bloque.Id,
            ContenidoJson = bloque.ContenidoJson,
            TipoStr = bloque.Tipo.ToString()
        });

        bloque.ContenidoJson = version.ContenidoJson;
        bloque.ActualizadoEn = DateTime.UtcNow;
        bloque.Pagina.ActualizadaEn = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    private static string ContenidoPorDefecto(TipoBloque tipo) => tipo switch
    {
        TipoBloque.Codigo => "{\"lenguaje\":\"javascript\",\"codigo\":\"\"}",
        TipoBloque.Llamada => "{\"emoji\":\"💡\",\"texto\":\"\",\"color\":\"amarillo\"}",
        TipoBloque.Imagen => "{\"url\":\"\",\"alt\":\"\"}",
        _ => "{\"texto\":\"\"}"
    };
}
