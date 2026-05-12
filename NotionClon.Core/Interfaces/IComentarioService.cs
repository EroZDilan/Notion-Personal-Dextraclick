using NotionClon.Core.DTOs;

namespace NotionClon.Core.Interfaces;

public interface IComentarioService
{
    Task<List<ComentarioDto>> ObtenerPorBloqueAsync(Guid bloqueId, string usuarioId);
    Task<ComentarioDto> AgregarAsync(CrearComentarioDto dto, string usuarioId, string nombreUsuario);
    Task EliminarAsync(Guid id, string usuarioId);
}
