using NotionClon.Core.DTOs;

namespace NotionClon.Core.Interfaces;

public interface IChatService
{
    Task<ChatResponseDto> ProcesarAsync(ChatRequestDto request, string usuarioId);
}
