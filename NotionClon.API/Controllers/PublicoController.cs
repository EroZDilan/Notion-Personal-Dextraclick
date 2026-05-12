using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.Interfaces;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class PublicoController : ControllerBase
{
    private readonly IPaginaService _paginaService;

    public PublicoController(IPaginaService paginaService)
    {
        _paginaService = paginaService;
    }

    [HttpGet("paginas/{id:guid}")]
    public async Task<IActionResult> ObtenerPagina(Guid id)
    {
        try
        {
            var pagina = await _paginaService.ObtenerPublicaAsync(id);
            return Ok(pagina);
        }
        catch (KeyNotFoundException)
        {
            return NotFound();
        }
        catch (UnauthorizedAccessException)
        {
            return NotFound();
        }
    }
}
