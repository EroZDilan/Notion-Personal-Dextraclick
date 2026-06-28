using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using NotionClon.Core.DTOs;
using NotionClon.Core.Interfaces;
using System.Security.Claims;

namespace NotionClon.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ChatController : ControllerBase
{
    private readonly IChatService _chatService;

    public ChatController(IChatService chatService)
    {
        _chatService = chatService;
    }

    [HttpPost]
    public async Task<IActionResult> Procesar([FromBody] ChatRequestDto dto)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var resultado = await _chatService.ProcesarAsync(dto, usuarioId);
        return Ok(resultado);
    }
}
