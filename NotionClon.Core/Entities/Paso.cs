namespace NotionClon.Core.Entities;

public class Paso
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = string.Empty;
    public bool Completado { get; set; }
    public int Orden { get; set; }
    // Un Paso pertenece a una Tarea directamente O a una Subtarea (nunca ambos)
    public Guid? TareaId { get; set; }
    public Tarea? Tarea { get; set; }
    public Guid? SubtareaId { get; set; }
    public Subtarea? Subtarea { get; set; }
}
