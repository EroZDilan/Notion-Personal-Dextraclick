using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;
using NotionClon.Infrastructure.Services;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaginasController : ControllerBase
{
    private readonly IPaginaService _paginaService;
    private readonly ImagenService _imagenService;

    public PaginasController(IPaginaService paginaService, ImagenService imagenService)
    {
        _paginaService = paginaService;
        _imagenService = imagenService;
    }

    private string UsuarioId => User.FindFirstValue(ClaimTypes.NameIdentifier)!;

    [HttpGet]
    public async Task<IActionResult> ObtenerArbol()
    {
        var paginas = await _paginaService.ObtenerArbolAsync(UsuarioId);
        return Ok(paginas);
    }

    [HttpGet("buscar")]
    public async Task<IActionResult> Buscar([FromQuery] string q)
    {
        var resultados = await _paginaService.BuscarAsync(q, UsuarioId);
        return Ok(resultados);
    }

    [HttpGet("papelera")]
    public async Task<IActionResult> ObtenerPapelera()
    {
        var paginas = await _paginaService.ObtenerPapeleraAsync(UsuarioId);
        return Ok(paginas);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Obtener(Guid id)
    {
        try
        {
            var pagina = await _paginaService.ObtenerConBloquesAsync(id, UsuarioId);
            return Ok(pagina);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearPaginaDto dto)
    {
        var pagina = await _paginaService.CrearAsync(UsuarioId, dto.PadreId);
        return CreatedAtAction(nameof(Obtener), new { id = pagina.Id }, pagina);
    }

    [HttpPatch("{id:guid}")]
    public async Task<IActionResult> ActualizarTitulo(Guid id, [FromBody] ActualizarTituloDto dto)
    {
        try
        {
            await _paginaService.ActualizarTituloAsync(id, dto, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Archivar(Guid id)
    {
        try
        {
            await _paginaService.ArchivarAsync(id, UsuarioId);
            return NoContent();
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
            await _paginaService.RestaurarAsync(id, UsuarioId);
            return NoContent();
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
    }

    [HttpPost("imagen")]
    public async Task<IActionResult> SubirImagen(IFormFile archivo)
    {
        try
        {
            var url = await _imagenService.GuardarAsync(archivo, UsuarioId);
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }
}
