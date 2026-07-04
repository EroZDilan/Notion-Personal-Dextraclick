namespace NotionClon.Core.DTOs;

public class TareaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string? Descripcion { get; set; }
    public string Prioridad { get; set; } = "Media";
    public string Estado { get; set; } = "Todo";
    public DateTime? FechaLimite { get; set; }
    public DateTime CreadaEn { get; set; }
    public DateTime ActualizadaEn { get; set; }
    public int TotalPasos { get; set; }
    public int PasosCompletados { get; set; }
}

public class TareaDetalleDto : TareaDto
{
    public List<SubtareaDto> Subtareas { get; set; } = [];
    public List<PasoDto> Pasos { get; set; } = [];
}

public class SubtareaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Estado { get; set; } = "Todo";
    public int Orden { get; set; }
    public List<PasoDto> Pasos { get; set; } = [];
}

public class PasoDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public bool Completado { get; set; }
    public int Orden { get; set; }
    public Guid? SubtareaId { get; set; }
}

// Requests
public class CrearTareaDto
{
    public string Titulo { get; set; } = "Nueva tarea";
    public string? Descripcion { get; set; }
    public string Prioridad { get; set; } = "Media";
    public DateTime? FechaLimite { get; set; }
}

public class ActualizarTareaDto
{
    public string? Titulo { get; set; }
    public string? Descripcion { get; set; }
    public string? Prioridad { get; set; }
    public string? Estado { get; set; }
    public DateTime? FechaLimite { get; set; }
    public bool ClearFechaLimite { get; set; }
}

public class CrearSubtareaDto
{
    public string Titulo { get; set; } = string.Empty;
}

public class ActualizarSubtareaDto
{
    public string Titulo { get; set; } = string.Empty;
}

public class CrearPasoDto
{
    public string Titulo { get; set; } = string.Empty;
}

public class ActualizarPasoDto
{
    public string? Titulo { get; set; }
    public bool? Completado { get; set; }
}
