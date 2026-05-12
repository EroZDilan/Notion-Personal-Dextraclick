namespace NotionClon.Core.DTOs;

public class BloqueDto
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public object Contenido { get; set; } = new();
    public int Orden { get; set; }
}

public class CrearBloqueDto
{
    public Guid PaginaId { get; set; }
    public string Tipo { get; set; } = "Parrafo";
    public int Orden { get; set; }
}

public class ActualizarBloqueDto
{
    public object Contenido { get; set; } = new();
}

public class ReordenarBloquesDto
{
    public List<Guid> OrdenIds { get; set; } = new();
}
