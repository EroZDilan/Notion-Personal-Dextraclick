namespace NotionClon.Core.DTOs;

public class PaginaDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public bool EsPublica { get; set; }
    public Guid? PaginaPadreId { get; set; }
    public List<PaginaDto> SubPaginas { get; set; } = new();
    public DateTime ActualizadaEn { get; set; }
}

public class PaginaConBloquesDto
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string? CoverUrl { get; set; }
    public bool EsPublica { get; set; }
    public Guid? PaginaPadreId { get; set; }
    public List<BloqueDto> Bloques { get; set; } = new();
    public List<PaginaDto> SubPaginas { get; set; } = new();
}

public class CrearPaginaDto
{
    public Guid? PadreId { get; set; }
}

public class ActualizarTituloDto
{
    public string Titulo { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
}

public class ActualizarCoverDto
{
    public string? CoverUrl { get; set; }
}

public class ActualizarVisibilidadDto
{
    public bool EsPublica { get; set; }
}

public class ResultadoBusquedaDto
{
    public Guid PaginaId { get; set; }
    public string Titulo { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string? Fragmento { get; set; }
    public string Tipo { get; set; } = "pagina";
}
