namespace NotionClon.Core.Entities;

public enum Prioridad { Alta = 1, Media = 2, Baja = 3 }
public enum EstadoTarea { Todo = 0, EnProgreso = 1, Hecho = 2 }

public class Tarea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = "Nueva tarea";
    public string? Descripcion { get; set; }
    public Prioridad Prioridad { get; set; } = Prioridad.Media;
    public EstadoTarea Estado { get; set; } = EstadoTarea.Todo;
    public DateTime? FechaLimite { get; set; }
    public string UsuarioId { get; set; } = string.Empty;
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadaEn { get; set; } = DateTime.UtcNow;
    public ICollection<Subtarea> Subtareas { get; set; } = new List<Subtarea>();
    public ICollection<Paso> Pasos { get; set; } = new List<Paso>();
}
