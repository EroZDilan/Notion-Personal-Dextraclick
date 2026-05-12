using NotionClon.Core.DTOs;

namespace NotionClon.Core.Interfaces;

public interface IPaginaService
{
    Task<List<PaginaDto>> ObtenerArbolAsync(string usuarioId);
    Task<PaginaConBloquesDto> ObtenerConBloquesAsync(Guid id, string usuarioId);
    Task<PaginaConBloquesDto> ObtenerPublicaAsync(Guid id);
    Task<PaginaDto> CrearAsync(string usuarioId, Guid? padreId = null);
    Task ActualizarTituloAsync(Guid id, ActualizarTituloDto dto, string usuarioId);
    Task ActualizarCoverAsync(Guid id, string? coverUrl, string usuarioId);
    Task ActualizarVisibilidadAsync(Guid id, bool esPublica, string usuarioId);
    Task ArchivarAsync(Guid id, string usuarioId);
    Task RestaurarAsync(Guid id, string usuarioId);
    Task<List<PaginaDto>> ObtenerPapeleraAsync(string usuarioId);
    Task<List<ResultadoBusquedaDto>> BuscarAsync(string query, string usuarioId);
}
