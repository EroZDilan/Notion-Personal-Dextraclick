using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ComentariosController : ControllerBase
{
    private readonly IComentarioService _comentarioService;

    public ComentariosController(IComentarioService comentarioService)
    {
        _comentarioService = comentarioService;
    }

    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;
    private string NombreUsuario => User.FindFirstValue(ClaimTypes.Name)
        ?? User.FindFirstValue(ClaimTypes.Email)
        ?? "Usuario";

    [HttpGet("bloque/{bloqueId:guid}")]
    public async Task<IActionResult> ObtenerPorBloque(Guid bloqueId)
    {
        try
        {
            var comentarios = await _comentarioService.ObtenerPorBloqueAsync(bloqueId, UsuarioId);
            return Ok(comentarios);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Agregar([FromBody] CrearComentarioDto dto)
    {
        try
        {
            var comentario = await _comentarioService.AgregarAsync(dto, UsuarioId, NombreUsuario);
            return Ok(comentario);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        try
        {
            await _comentarioService.EliminarAsync(id, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }
}
