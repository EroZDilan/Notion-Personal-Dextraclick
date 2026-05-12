namespace NotionClon.Core.Entities;

public class Bloque
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PaginaId { get; set; }
    public Pagina Pagina { get; set; } = null!;
    public TipoBloque Tipo { get; set; }
    public string ContenidoJson { get; set; } = "{}";
    public int Orden { get; set; }
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
    public ICollection<VersionBloque> Versiones { get; set; } = new List<VersionBloque>();
    public ICollection<Comentario> Comentarios { get; set; } = new List<Comentario>();
}
