namespace NotionClon.Core.Entities;

public class Pagina
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = "Sin título";
    public string Emoji { get; set; } = "📄";
    public string UsuarioId { get; set; } = string.Empty;
    public Guid? PaginaPadreId { get; set; }
    public Pagina? PaginaPadre { get; set; }
    public ICollection<Pagina> SubPaginas { get; set; } = new List<Pagina>();
    public ICollection<Bloque> Bloques { get; set; } = new List<Bloque>();
    public bool Archivada { get; set; }
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadaEn { get; set; } = DateTime.UtcNow;
}
