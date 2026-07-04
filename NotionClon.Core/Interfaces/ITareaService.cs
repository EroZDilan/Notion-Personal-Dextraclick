using NotionClon.Core.DTOs;

namespace NotionClon.Core.Interfaces;

public interface ITareaService
{
    Task<List<TareaDto>> ListarAsync(string usuarioId, string? estado = null, string? prioridad = null);
    Task<TareaDetalleDto> ObtenerAsync(Guid id, string usuarioId);
    Task<TareaDto> CrearAsync(CrearTareaDto dto, string usuarioId);
    Task ActualizarAsync(Guid id, ActualizarTareaDto dto, string usuarioId);
    Task EliminarAsync(Guid id, string usuarioId);

    Task<SubtareaDto> CrearSubtareaAsync(Guid tareaId, CrearSubtareaDto dto, string usuarioId);
    Task ActualizarSubtareaAsync(Guid subtareaId, ActualizarSubtareaDto dto, string usuarioId);
    Task EliminarSubtareaAsync(Guid subtareaId, string usuarioId);

    Task<PasoDto> CrearPasoEnTareaAsync(Guid tareaId, CrearPasoDto dto, string usuarioId);
    Task<PasoDto> CrearPasoEnSubtareaAsync(Guid subtareaId, CrearPasoDto dto, string usuarioId);
    Task ActualizarPasoAsync(Guid pasoId, ActualizarPasoDto dto, string usuarioId);
    Task EliminarPasoAsync(Guid pasoId, string usuarioId);
}
