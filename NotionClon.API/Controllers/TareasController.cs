using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TareasController : ControllerBase
{
    private readonly ITareaService _tareas;
    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    public TareasController(ITareaService tareas) => _tareas = tareas;

    // ── TAREAS ───────────────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> Listar([FromQuery] string? estado, [FromQuery] string? prioridad)
    {
        var lista = await _tareas.ListarAsync(UsuarioId, estado, prioridad);
        return Ok(lista);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obtener(Guid id)
    {
        try { return Ok(await _tareas.ObtenerAsync(id, UsuarioId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearTareaDto dto)
    {
        var tarea = await _tareas.CrearAsync(dto, UsuarioId);
        return CreatedAtAction(nameof(Obtener), new { id = tarea.Id }, tarea);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarTareaDto dto)
    {
        try { await _tareas.ActualizarAsync(id, dto, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        try { await _tareas.EliminarAsync(id, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── SUBTAREAS ────────────────────────────────────────────────────────────

    [HttpPost("{tareaId:guid}/subtareas")]
    public async Task<IActionResult> CrearSubtarea(Guid tareaId, [FromBody] CrearSubtareaDto dto)
    {
        try { return Ok(await _tareas.CrearSubtareaAsync(tareaId, dto, UsuarioId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("subtareas/{id:guid}")]
    public async Task<IActionResult> ActualizarSubtarea(Guid id, [FromBody] ActualizarSubtareaDto dto)
    {
        try { await _tareas.ActualizarSubtareaAsync(id, dto, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpDelete("subtareas/{id:guid}")]
    public async Task<IActionResult> EliminarSubtarea(Guid id)
    {
        try { await _tareas.EliminarSubtareaAsync(id, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    // ── PASOS ────────────────────────────────────────────────────────────────

    [HttpPost("{tareaId:guid}/pasos")]
    public async Task<IActionResult> CrearPasoEnTarea(Guid tareaId, [FromBody] CrearPasoDto dto)
    {
        try { return Ok(await _tareas.CrearPasoEnTareaAsync(tareaId, dto, UsuarioId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPost("subtareas/{subtareaId:guid}/pasos")]
    public async Task<IActionResult> CrearPasoEnSubtarea(Guid subtareaId, [FromBody] CrearPasoDto dto)
    {
        try { return Ok(await _tareas.CrearPasoEnSubtareaAsync(subtareaId, dto, UsuarioId)); }
        catch (KeyNotFoundException) { return NotFound(); }
    }

    [HttpPut("pasos/{id:guid}")]
    public async Task<IActionResult> ActualizarPaso(Guid id, [FromBody] ActualizarPasoDto dto)
    {
        try { await _tareas.ActualizarPasoAsync(id, dto, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }

    [HttpDelete("pasos/{id:guid}")]
    public async Task<IActionResult> EliminarPaso(Guid id)
    {
        try { await _tareas.EliminarPasoAsync(id, UsuarioId); return NoContent(); }
        catch (KeyNotFoundException) { return NotFound(); }
        catch (UnauthorizedAccessException) { return Forbid(); }
    }
}
