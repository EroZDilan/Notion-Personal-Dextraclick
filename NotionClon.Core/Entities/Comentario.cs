namespace NotionClon.Core.Entities;

public class Comentario
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid BloqueId { get; set; }
    public Bloque Bloque { get; set; } = null!;
    public string UsuarioId { get; set; } = string.Empty;
    public string NombreUsuario { get; set; } = string.Empty;
    public string Texto { get; set; } = string.Empty;
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
}
