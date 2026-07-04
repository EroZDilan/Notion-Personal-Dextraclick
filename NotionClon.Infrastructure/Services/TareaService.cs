using Microsoft.EntityFrameworkCore;
using NotionClon.Core.DTOs;
using NotionClon.Core.Entities;
using NotionClon.Core.Interfaces;
using NotionClon.Infrastructure.Data;

namespace NotionClon.Infrastructure.Services;

public class TareaService : ITareaService
{
    private readonly AppDbContext _ctx;

    public TareaService(AppDbContext ctx) => _ctx = ctx;

    // ── TAREAS ───────────────────────────────────────────────────────────────

    public async Task<List<TareaDto>> ListarAsync(string usuarioId, string? estado = null, string? prioridad = null)
    {
        var query = _ctx.Tareas
            .Include(t => t.Subtareas).ThenInclude(s => s.Pasos)
            .Include(t => t.Pasos)
            .Where(t => t.UsuarioId == usuarioId);

        if (!string.IsNullOrWhiteSpace(estado) &&
            Enum.TryParse<EstadoTarea>(estado, true, out var e))
            query = query.Where(t => t.Estado == e);

        if (!string.IsNullOrWhiteSpace(prioridad) &&
            Enum.TryParse<Prioridad>(prioridad, true, out var p))
            query = query.Where(t => t.Prioridad == p);

        var tareas = await query
            .OrderBy(t => t.Prioridad)
            .ThenBy(t => t.CreadaEn)
            .ToListAsync();

        return tareas.Select(MapDto).ToList();
    }

    public async Task<TareaDetalleDto> ObtenerAsync(Guid id, string usuarioId)
    {
        var tarea = await CargarTareaAsync(id, usuarioId);
        return MapDetalle(tarea);
    }

    public async Task<TareaDto> CrearAsync(CrearTareaDto dto, string usuarioId)
    {
        var tarea = new Tarea
        {
            Titulo = dto.Titulo.Trim(),
            Descripcion = dto.Descripcion?.Trim(),
            Prioridad = ParsePrioridad(dto.Prioridad),
            FechaLimite = dto.FechaLimite,
            UsuarioId = usuarioId
        };
        _ctx.Tareas.Add(tarea);
        await _ctx.SaveChangesAsync();
        return MapDto(tarea);
    }

    public async Task ActualizarAsync(Guid id, ActualizarTareaDto dto, string usuarioId)
    {
        var tarea = await _ctx.Tareas
            .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Tarea no encontrada");

        if (dto.Titulo != null) tarea.Titulo = dto.Titulo.Trim();
        if (dto.Descripcion != null) tarea.Descripcion = dto.Descripcion.Trim();
        if (dto.Prioridad != null) tarea.Prioridad = ParsePrioridad(dto.Prioridad);
        if (dto.Estado != null) tarea.Estado = ParseEstado(dto.Estado);
        if (dto.ClearFechaLimite) tarea.FechaLimite = null;
        else if (dto.FechaLimite.HasValue) tarea.FechaLimite = dto.FechaLimite;
        tarea.ActualizadaEn = DateTime.UtcNow;
        await _ctx.SaveChangesAsync();
    }

    public async Task EliminarAsync(Guid id, string usuarioId)
    {
        var tarea = await _ctx.Tareas
            .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Tarea no encontrada");
        _ctx.Tareas.Remove(tarea);
        await _ctx.SaveChangesAsync();
    }

    // ── SUBTAREAS ────────────────────────────────────────────────────────────

    public async Task<SubtareaDto> CrearSubtareaAsync(Guid tareaId, CrearSubtareaDto dto, string usuarioId)
    {
        await VerificarTareaAsync(tareaId, usuarioId);
        var orden = await _ctx.Subtareas.CountAsync(s => s.TareaId == tareaId);
        var sub = new Subtarea { TareaId = tareaId, Titulo = dto.Titulo.Trim(), Orden = orden };
        _ctx.Subtareas.Add(sub);
        await _ctx.SaveChangesAsync();
        await RecalcularTareaAsync(tareaId);
        return MapSubtarea(sub);
    }

    public async Task ActualizarSubtareaAsync(Guid subtareaId, ActualizarSubtareaDto dto, string usuarioId)
    {
        var sub = await _ctx.Subtareas
            .Include(s => s.Tarea)
            .FirstOrDefaultAsync(s => s.Id == subtareaId && s.Tarea.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Subtarea no encontrada");
        sub.Titulo = dto.Titulo.Trim();
        await _ctx.SaveChangesAsync();
    }

    public async Task EliminarSubtareaAsync(Guid subtareaId, string usuarioId)
    {
        var sub = await _ctx.Subtareas
            .Include(s => s.Tarea)
            .FirstOrDefaultAsync(s => s.Id == subtareaId && s.Tarea.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Subtarea no encontrada");
        var tareaId = sub.TareaId;
        _ctx.Subtareas.Remove(sub);
        await _ctx.SaveChangesAsync();
        await RecalcularTareaAsync(tareaId);
    }

    // ── PASOS ────────────────────────────────────────────────────────────────

    public async Task<PasoDto> CrearPasoEnTareaAsync(Guid tareaId, CrearPasoDto dto, string usuarioId)
    {
        await VerificarTareaAsync(tareaId, usuarioId);
        var orden = await _ctx.Pasos.CountAsync(p => p.TareaId == tareaId);
        var paso = new Paso { TareaId = tareaId, Titulo = dto.Titulo.Trim(), Orden = orden };
        _ctx.Pasos.Add(paso);
        await _ctx.SaveChangesAsync();
        await RecalcularTareaAsync(tareaId);
        return MapPaso(paso);
    }

    public async Task<PasoDto> CrearPasoEnSubtareaAsync(Guid subtareaId, CrearPasoDto dto, string usuarioId)
    {
        var sub = await _ctx.Subtareas
            .Include(s => s.Tarea)
            .FirstOrDefaultAsync(s => s.Id == subtareaId && s.Tarea.UsuarioId == usuarioId)
            ?? throw new KeyNotFoundException("Subtarea no encontrada");
        var orden = await _ctx.Pasos.CountAsync(p => p.SubtareaId == subtareaId);
        var paso = new Paso { SubtareaId = subtareaId, Titulo = dto.Titulo.Trim(), Orden = orden };
        _ctx.Pasos.Add(paso);
        await _ctx.SaveChangesAsync();
        await RecalcularSubtareaAsync(subtareaId);
        await RecalcularTareaAsync(sub.TareaId);
        return MapPaso(paso);
    }

    public async Task ActualizarPasoAsync(Guid pasoId, ActualizarPasoDto dto, string usuarioId)
    {
        var paso = await _ctx.Pasos
            .Include(p => p.Tarea)
            .Include(p => p.Subtarea).ThenInclude(s => s!.Tarea)
            .FirstOrDefaultAsync(p => p.Id == pasoId)
            ?? throw new KeyNotFoundException("Paso no encontrado");

        // Verificar pertenencia al usuario
        var tareaUsuarioId = paso.Tarea?.UsuarioId ?? paso.Subtarea?.Tarea?.UsuarioId;
        if (tareaUsuarioId != usuarioId)
            throw new UnauthorizedAccessException();

        if (dto.Titulo != null) paso.Titulo = dto.Titulo.Trim();
        if (dto.Completado.HasValue) paso.Completado = dto.Completado.Value;
        await _ctx.SaveChangesAsync();

        // Cascade
        if (paso.SubtareaId.HasValue)
        {
            await RecalcularSubtareaAsync(paso.SubtareaId.Value);
            var sub = await _ctx.Subtareas.FindAsync(paso.SubtareaId.Value);
            if (sub != null) await RecalcularTareaAsync(sub.TareaId);
        }
        else if (paso.TareaId.HasValue)
        {
            await RecalcularTareaAsync(paso.TareaId.Value);
        }
    }

    public async Task EliminarPasoAsync(Guid pasoId, string usuarioId)
    {
        var paso = await _ctx.Pasos
            .Include(p => p.Tarea)
            .Include(p => p.Subtarea).ThenInclude(s => s!.Tarea)
            .FirstOrDefaultAsync(p => p.Id == pasoId)
            ?? throw new KeyNotFoundException("Paso no encontrado");

        var tareaUsuarioId = paso.Tarea?.UsuarioId ?? paso.Subtarea?.Tarea?.UsuarioId;
        if (tareaUsuarioId != usuarioId) throw new UnauthorizedAccessException();

        var tareaId = paso.TareaId ?? paso.Subtarea?.TareaId;
        var subtareaId = paso.SubtareaId;
        _ctx.Pasos.Remove(paso);
        await _ctx.SaveChangesAsync();

        if (subtareaId.HasValue) await RecalcularSubtareaAsync(subtareaId.Value);
        if (tareaId.HasValue) await RecalcularTareaAsync(tareaId.Value);
    }

    // ── RECÁLCULO EN CASCADA ─────────────────────────────────────────────────

    private async Task RecalcularSubtareaAsync(Guid subtareaId)
    {
        var sub = await _ctx.Subtareas
            .Include(s => s.Pasos)
            .FirstOrDefaultAsync(s => s.Id == subtareaId);
        if (sub == null) return;

        sub.Estado = sub.Pasos.Count == 0
            ? EstadoTarea.Todo
            : sub.Pasos.All(p => p.Completado)
                ? EstadoTarea.Hecho
                : sub.Pasos.Any(p => p.Completado)
                    ? EstadoTarea.EnProgreso
                    : EstadoTarea.Todo;
        await _ctx.SaveChangesAsync();
    }

    private async Task RecalcularTareaAsync(Guid tareaId)
    {
        var tarea = await _ctx.Tareas
            .Include(t => t.Subtareas).ThenInclude(s => s.Pasos)
            .Include(t => t.Pasos)
            .FirstOrDefaultAsync(t => t.Id == tareaId);
        if (tarea == null) return;

        var todosHecho = true;
        var hayProgreso = false;
        var tieneItems = tarea.Subtareas.Any() || tarea.Pasos.Any();

        foreach (var sub in tarea.Subtareas)
        {
            if (sub.Estado != EstadoTarea.Hecho) todosHecho = false;
            if (sub.Estado != EstadoTarea.Todo) hayProgreso = true;
        }
        foreach (var paso in tarea.Pasos)
        {
            if (!paso.Completado) todosHecho = false;
            if (paso.Completado) hayProgreso = true;
        }

        tarea.Estado = !tieneItems
            ? tarea.Estado  // sin items, no tocamos el estado
            : todosHecho
                ? EstadoTarea.Hecho
                : hayProgreso
                    ? EstadoTarea.EnProgreso
                    : EstadoTarea.Todo;

        tarea.ActualizadaEn = DateTime.UtcNow;
        await _ctx.SaveChangesAsync();
    }

    // ── HELPERS ──────────────────────────────────────────────────────────────

    private async Task<Tarea> CargarTareaAsync(Guid id, string usuarioId) =>
        await _ctx.Tareas
            .Include(t => t.Subtareas.OrderBy(s => s.Orden))
                .ThenInclude(s => s.Pasos.OrderBy(p => p.Orden))
            .Include(t => t.Pasos.OrderBy(p => p.Orden))
            .FirstOrDefaultAsync(t => t.Id == id && t.UsuarioId == usuarioId)
        ?? throw new KeyNotFoundException("Tarea no encontrada");

    private async Task VerificarTareaAsync(Guid tareaId, string usuarioId)
    {
        var existe = await _ctx.Tareas.AnyAsync(t => t.Id == tareaId && t.UsuarioId == usuarioId);
        if (!existe) throw new KeyNotFoundException("Tarea no encontrada");
    }

    private static TareaDto MapDto(Tarea t)
    {
        var todosLosPasos = t.Subtareas.SelectMany(s => s.Pasos).Concat(t.Pasos).ToList();
        return new TareaDto
        {
            Id = t.Id,
            Titulo = t.Titulo,
            Descripcion = t.Descripcion,
            Prioridad = t.Prioridad.ToString(),
            Estado = t.Estado.ToString(),
            FechaLimite = t.FechaLimite,
            CreadaEn = t.CreadaEn,
            ActualizadaEn = t.ActualizadaEn,
            TotalPasos = todosLosPasos.Count,
            PasosCompletados = todosLosPasos.Count(p => p.Completado)
        };
    }

    private static TareaDetalleDto MapDetalle(Tarea t) => new()
    {
        Id = t.Id,
        Titulo = t.Titulo,
        Descripcion = t.Descripcion,
        Prioridad = t.Prioridad.ToString(),
        Estado = t.Estado.ToString(),
        FechaLimite = t.FechaLimite,
        CreadaEn = t.CreadaEn,
        ActualizadaEn = t.ActualizadaEn,
        TotalPasos = t.Subtareas.SelectMany(s => s.Pasos).Count() + t.Pasos.Count,
        PasosCompletados = t.Subtareas.SelectMany(s => s.Pasos).Count(p => p.Completado) + t.Pasos.Count(p => p.Completado),
        Subtareas = t.Subtareas.Select(MapSubtarea).ToList(),
        Pasos = t.Pasos.Select(MapPaso).ToList()
    };

    private static SubtareaDto MapSubtarea(Subtarea s) => new()
    {
        Id = s.Id,
        Titulo = s.Titulo,
        Estado = s.Estado.ToString(),
        Orden = s.Orden,
        Pasos = s.Pasos.OrderBy(p => p.Orden).Select(MapPaso).ToList()
    };

    private static PasoDto MapPaso(Paso p) => new()
    {
        Id = p.Id,
        Titulo = p.Titulo,
        Completado = p.Completado,
        Orden = p.Orden,
        SubtareaId = p.SubtareaId
    };

    private static Prioridad ParsePrioridad(string? s) =>
        Enum.TryParse<Prioridad>(s, true, out var v) ? v : Prioridad.Media;

    private static EstadoTarea ParseEstado(string? s) =>
        Enum.TryParse<EstadoTarea>(s, true, out var v) ? v : EstadoTarea.Todo;
}
