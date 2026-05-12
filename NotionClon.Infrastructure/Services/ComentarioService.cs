using Microsoft.EntityFrameworkCore;
using NotionClon.Core.DTOs;
using NotionClon.Core.Entities;
using NotionClon.Core.Interfaces;
using NotionClon.Infrastructure.Data;

namespace NotionClon.Infrastructure.Services;

public class ComentarioService : IComentarioService
{
    private readonly AppDbContext _context;

    public ComentarioService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ComentarioDto>> ObtenerPorBloqueAsync(Guid bloqueId, string usuarioId)
    {
        var existe = await _context.Bloques
            .AnyAsync(b => b.Id == bloqueId && b.Pagina.UsuarioId == usuarioId);

        if (!existe) throw new KeyNotFoundException("Bloque no encontrado");

        return await _context.Comentarios
            .Where(c => c.BloqueId == bloqueId)
            .OrderBy(c => c.CreadaEn)
            .Select(c => new ComentarioDto
            {
                Id = c.Id,
                BloqueId = c.BloqueId,
                UsuarioId = c.UsuarioId,
                NombreUsuario = c.NombreUsuario,
                Texto = c.Texto,
                CreadaEn = c.CreadaEn
            })
            .ToListAsync();
    }

    public async Task<ComentarioDto> AgregarAsync(CrearComentarioDto dto, string usuarioId, string nombreUsuario)
    {
        if (string.IsNullOrWhiteSpace(dto.Texto))
            throw new ArgumentException("El comentario no puede estar vacío");

        var existe = await _context.Bloques
            .AnyAsync(b => b.Id == dto.BloqueId && b.Pagina.UsuarioId == usuarioId);

        if (!existe) throw new KeyNotFoundException("Bloque no encontrado");

        var comentario = new Comentario
        {
            BloqueId = dto.BloqueId,
            UsuarioId = usuarioId,
            NombreUsuario = nombreUsuario,
            Texto = dto.Texto.Trim()
        };

        _context.Comentarios.Add(comentario);
        await _context.SaveChangesAsync();

        return new ComentarioDto
        {
            Id = comentario.Id,
            BloqueId = comentario.BloqueId,
            UsuarioId = comentario.UsuarioId,
            NombreUsuario = comentario.NombreUsuario,
            Texto = comentario.Texto,
            CreadaEn = comentario.CreadaEn
        };
    }

    public async Task EliminarAsync(Guid id, string usuarioId)
    {
        var comentario = await _context.Comentarios
            .FirstOrDefaultAsync(c => c.Id == id && c.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Comentario no encontrado");

        _context.Comentarios.Remove(comentario);
        await _context.SaveChangesAsync();
    }
}
