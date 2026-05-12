using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.Interfaces;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VersionesController : ControllerBase
{
    private readonly IBloqueService _bloqueService;

    public VersionesController(IBloqueService bloqueService)
    {
        _bloqueService = bloqueService;
    }

    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet("bloque/{bloqueId:guid}")]
    public async Task<IActionResult> ObtenerPorBloque(Guid bloqueId)
    {
        try
        {
            var versiones = await _bloqueService.ObtenerVersionesAsync(bloqueId, UsuarioId);
            return Ok(versiones);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("{id:guid}/restaurar")]
    public async Task<IActionResult> Restaurar(Guid id)
    {
        try
        {
            await _bloqueService.RestaurarVersionAsync(id, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
