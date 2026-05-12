namespace NotionClon.Core.Entities;

public class VersionBloque
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BloqueId { get; set; }
    public Bloque Bloque { get; set; } = null!;
    public string ContenidoJson { get; set; } = "{}";
    public string TipoStr { get; set; } = string.Empty;
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
}
