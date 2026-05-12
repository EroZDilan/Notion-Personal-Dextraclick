using NotionClon.Core.DTOs;

namespace NotionClon.Core.Interfaces;

public interface IBloqueService
{
    Task<BloqueDto> CrearBloqueAsync(CrearBloqueDto dto, string usuarioId);
    Task ActualizarContenidoAsync(Guid bloqueId, object contenido, string usuarioId);
    Task ReordenarBloquesAsync(Guid paginaId, List<Guid> ordenIds, string usuarioId);
    Task EliminarBloqueAsync(Guid bloqueId, string usuarioId);
    Task<List<VersionBloqueDto>> ObtenerVersionesAsync(Guid bloqueId, string usuarioId);
    Task RestaurarVersionAsync(Guid versionId, string usuarioId);
}
