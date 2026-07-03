namespace NotionClon.Core.DTOs;

public class ChatRequestDto
{
    public string Mensaje { get; set; } = string.Empty;
    public AccionPendienteDto? ConfirmarAccionPendiente { get; set; }
    public string? ContextoConversacion { get; set; }
}

public class ChatResponseDto
{
    public string Respuesta { get; set; } = string.Empty;
    public List<AccionEjecutadaDto> AccionesEjecutadas { get; set; } = new();
    public AccionPendienteDto? AccionPendiente { get; set; }
}

public class AccionPendienteDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public Dictionary<string, string> Parametros { get; set; } = new();
}

public class AccionEjecutadaDto
{
    public string Tipo { get; set; } = string.Empty;
    public string Descripcion { get; set; } = string.Empty;
    public string? PaginaId { get; set; }
}
