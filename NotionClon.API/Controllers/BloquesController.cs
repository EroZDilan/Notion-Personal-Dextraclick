using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BloquesController : ControllerBase
{
    private readonly IBloqueService _bloqueService;

    public BloquesController(IBloqueService bloqueService)
    {
        _bloqueService = bloqueService;
    }

    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearBloqueDto dto)
    {
        try
        {
            var bloque = await _bloqueService.CrearBloqueAsync(dto, UsuarioId);
            return Ok(bloque);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] ActualizarBloqueDto dto)
    {
        try
        {
            await _bloqueService.ActualizarContenidoAsync(id, dto.Contenido, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPut("reordenar/{paginaId:guid}")]
    public async Task<IActionResult> Reordenar(Guid paginaId, [FromBody] ReordenarBloquesDto dto)
    {
        try
        {
            await _bloqueService.ReordenarBloquesAsync(paginaId, dto.OrdenIds, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        try
        {
            await _bloqueService.EliminarBloqueAsync(id, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
