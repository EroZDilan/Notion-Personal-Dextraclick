namespace NotionClon.Core.Entities;

public class Subtarea
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TareaId { get; set; }
    public Tarea Tarea { get; set; } = null!;
    public string Titulo { get; set; } = string.Empty;
    public EstadoTarea Estado { get; set; } = EstadoTarea.Todo;
    public int Orden { get; set; }
    public ICollection<Paso> Pasos { get; set; } = new List<Paso>();
}
