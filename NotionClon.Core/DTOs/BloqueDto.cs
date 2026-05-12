namespace NotionClon.Core.DTOs;

public class BloqueDto
{
    public Guid Id { get; set; }
    public string Tipo { get; set; } = string.Empty;
    public object Contenido { get; set; } = new();
    public int Orden { get; set; }
    public int TotalComentarios { get; set; }
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

public class VersionBloqueDto
{
    public Guid Id { get; set; }
    public string ContenidoJson { get; set; } = string.Empty;
    public string TipoStr { get; set; } = string.Empty;
    public DateTime CreadaEn { get; set; }
}

public class ComentarioDto
{
    public Guid Id { get; set; }
    public Guid BloqueId { get; set; }
    public string UsuarioId { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public DateTime CreadaEn { get; set; }
}

public class CrearComentarioDto
{
    public Guid BloqueId { get; set; }
    public string Texto { get; set; } = string.Empty;
}
