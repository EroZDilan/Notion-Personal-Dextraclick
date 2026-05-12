# Editor de Notas tipo Notion (Minimalista)
### ASP.NET Core 8 + Editor de bloques + Drag & Drop

---

## ¿Qué es este proyecto?

Un editor de notas con sistema de bloques al estilo Notion: párrafos, encabezados, listas, código, imágenes. Las páginas se pueden anidar, hay drag & drop para reordenar bloques y soporte de markdown en tiempo real. El usuario tiene su propio espacio de trabajo privado.

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Backend | ASP.NET Core 8 Web API |
| Base de datos | SQL Server + Entity Framework Core |
| Auth | ASP.NET Identity + JWT |
| Almacenamiento | Azure Blob Storage (imágenes) |
| Frontend | React + TypeScript |
| Editor | Editor.js (editor de bloques open source) |
| Drag & Drop | dnd-kit |
| Despliegue | Azure App Service + Azure Blob |

---

## Estructura del proyecto

```
NotionClon/
├── Core/
│   ├── Entities/
│   │   ├── Pagina.cs
│   │   ├── Bloque.cs
│   │   └── Workspace.cs
│   ├── Interfaces/
│   │   ├── IPaginaService.cs
│   │   └── IBloqueService.cs
│   └── DTOs/
│       ├── PaginaDto.cs
│       └── BloqueDto.cs
├── Infrastructure/
│   ├── Data/
│   └── Storage/
│       └── AzureBlobService.cs
└── API/
    └── Controllers/
        ├── PaginasController.cs
        └── BloquesController.cs
```

---

## Fase 1 — Modelos

### Entidades

```csharp
// Core/Entities/Pagina.cs
public class Pagina
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Titulo { get; set; } = "Sin título";
    public string Emoji { get; set; } = "📄";
    public string UsuarioId { get; set; } = string.Empty;
    public Guid? PaginaPadreId { get; set; }        // para páginas anidadas
    public Pagina? PaginaPadre { get; set; }
    public ICollection<Pagina> SubPaginas { get; set; } = new List<Pagina>();
    public ICollection<Bloque> Bloques { get; set; } = new List<Bloque>();
    public bool Archivada { get; set; }
    public DateTime CreadaEn { get; set; } = DateTime.UtcNow;
    public DateTime ActualizadaEn { get; set; } = DateTime.UtcNow;
}

// Core/Entities/Bloque.cs
public class Bloque
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid PaginaId { get; set; }
    public Pagina Pagina { get; set; } = null!;
    public TipoBloque Tipo { get; set; }
    public string ContenidoJson { get; set; } = "{}"; // datos específicos por tipo
    public int Orden { get; set; }
    public DateTime ActualizadoEn { get; set; } = DateTime.UtcNow;
}

public enum TipoBloque
{
    Parrafo,
    Heading1,
    Heading2,
    Heading3,
    ListaBullets,
    ListaNumerada,
    Codigo,
    Imagen,
    Divisor,
    Llamada,      // callout con emoji
    Cita
}
```

### ContenidoJson por tipo de bloque

```json
// Párrafo
{ "texto": "Mi contenido aquí", "estilos": ["negrita", "italica"] }

// Código
{ "lenguaje": "csharp", "codigo": "Console.WriteLine(\"Hola\");" }

// Imagen
{ "url": "https://blob.azure.com/...", "alt": "descripción", "ancho": 800 }

// Llamada
{ "emoji": "💡", "texto": "Esto es importante", "color": "amarillo" }
```

---

## Fase 2 — Servicios

### Servicio de páginas

```csharp
// Core/Services/PaginaService.cs
public class PaginaService : IPaginaService
{
    private readonly AppDbContext _context;

    public PaginaService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<PaginaDto>> ObtenerArbolAsync(string usuarioId)
    {
        var paginas = await _context.Paginas
            .Where(p => p.UsuarioId == usuarioId && !p.Archivada)
            .Include(p => p.SubPaginas)
            .OrderBy(p => p.CreadaEn)
            .ToListAsync();

        // Solo retornar páginas raíz (el frontend construye el árbol)
        var raices = paginas.Where(p => p.PaginaPadreId == null).ToList();
        return raices.Select(MapearPaginaDto).ToList();
    }

    public async Task<PaginaConBloquesDto> ObtenerConBloquesAsync(Guid id, string usuarioId)
    {
        var pagina = await _context.Paginas
            .Include(p => p.Bloques.OrderBy(b => b.Orden))
            .Include(p => p.SubPaginas)
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId)
            ?? throw new Exception("Página no encontrada");

        return new PaginaConBloquesDto
        {
            Id = pagina.Id,
            Titulo = pagina.Titulo,
            Emoji = pagina.Emoji,
            Bloques = pagina.Bloques.Select(b => new BloqueDto
            {
                Id = b.Id,
                Tipo = b.Tipo.ToString(),
                Contenido = JsonConvert.DeserializeObject<object>(b.ContenidoJson)!,
                Orden = b.Orden
            }).ToList(),
            SubPaginas = pagina.SubPaginas.Select(s => new PaginaDto
            {
                Id = s.Id,
                Titulo = s.Titulo,
                Emoji = s.Emoji
            }).ToList()
        };
    }

    public async Task<Pagina> CrearAsync(string usuarioId, Guid? padreId = null)
    {
        var pagina = new Pagina
        {
            UsuarioId = usuarioId,
            PaginaPadreId = padreId,
            Titulo = "Sin título"
        };

        // Bloque vacío inicial
        pagina.Bloques.Add(new Bloque
        {
            Tipo = TipoBloque.Parrafo,
            ContenidoJson = "{\"texto\": \"\"}",
            Orden = 0
        });

        _context.Paginas.Add(pagina);
        await _context.SaveChangesAsync();
        return pagina;
    }

    public async Task ActualizarTituloAsync(Guid id, string titulo, string usuarioId)
    {
        var pagina = await _context.Paginas
            .FirstOrDefaultAsync(p => p.Id == id && p.UsuarioId == usuarioId)
            ?? throw new Exception("Página no encontrada");

        pagina.Titulo = titulo;
        pagina.ActualizadaEn = DateTime.UtcNow;
        await _context.SaveChangesAsync();
    }

    private PaginaDto MapearPaginaDto(Pagina p) => new()
    {
        Id = p.Id,
        Titulo = p.Titulo,
        Emoji = p.Emoji,
        SubPaginas = p.SubPaginas.Select(MapearPaginaDto).ToList()
    };
}
```

### Servicio de bloques

```csharp
// Core/Services/BloqueService.cs
public class BloqueService : IBloqueService
{
    private readonly AppDbContext _context;

    public BloqueService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Bloque> CrearBloqueAsync(Guid paginaId, TipoBloque tipo, int orden)
    {
        // Desplazar bloques existentes
        var bloques = await _context.Bloques
            .Where(b => b.PaginaId == paginaId && b.Orden >= orden)
            .ToListAsync();

        foreach (var b in bloques) b.Orden++;

        var nuevo = new Bloque
        {
            PaginaId = paginaId,
            Tipo = tipo,
            ContenidoJson = GetContenidoPorDefecto(tipo),
            Orden = orden
        };

        _context.Bloques.Add(nuevo);
        await _context.SaveChangesAsync();
        return nuevo;
    }

    public async Task ActualizarContenidoAsync(Guid bloqueId, object contenido)
    {
        var bloque = await _context.Bloques.FindAsync(bloqueId)
            ?? throw new Exception("Bloque no encontrado");

        bloque.ContenidoJson = JsonConvert.SerializeObject(contenido);
        bloque.ActualizadoEn = DateTime.UtcNow;

        // Actualizar la página padre también
        var pagina = await _context.Paginas.FindAsync(bloque.PaginaId);
        if (pagina != null) pagina.ActualizadaEn = DateTime.UtcNow;

        await _context.SaveChangesAsync();
    }

    public async Task ReordenarBloquesAsync(Guid paginaId, List<Guid> ordenIds)
    {
        var bloques = await _context.Bloques
            .Where(b => b.PaginaId == paginaId)
            .ToListAsync();

        for (int i = 0; i < ordenIds.Count; i++)
        {
            var bloque = bloques.FirstOrDefault(b => b.Id == ordenIds[i]);
            if (bloque != null) bloque.Orden = i;
        }

        await _context.SaveChangesAsync();
    }

    public async Task EliminarBloqueAsync(Guid bloqueId)
    {
        var bloque = await _context.Bloques.FindAsync(bloqueId)
            ?? throw new Exception("Bloque no encontrado");

        _context.Bloques.Remove(bloque);
        await _context.SaveChangesAsync();
    }

    private string GetContenidoPorDefecto(TipoBloque tipo) => tipo switch
    {
        TipoBloque.Parrafo => "{\"texto\": \"\"}",
        TipoBloque.Heading1 => "{\"texto\": \"\"}",
        TipoBloque.Codigo => "{\"lenguaje\": \"javascript\", \"codigo\": \"\"}",
        TipoBloque.Llamada => "{\"emoji\": \"💡\", \"texto\": \"\", \"color\": \"amarillo\"}",
        TipoBloque.Imagen => "{\"url\": \"\", \"alt\": \"\"}",
        _ => "{\"texto\": \"\"}"
    };
}
```

---

## Fase 3 — Upload de imágenes a Azure Blob

```csharp
// Infrastructure/Storage/AzureBlobService.cs
public class AzureBlobService
{
    private readonly BlobServiceClient _blobClient;
    private readonly string _containerName = "imagenes-notas";

    public AzureBlobService(IConfiguration config)
    {
        _blobClient = new BlobServiceClient(config["AzureBlob:ConnectionString"]);
    }

    public async Task<string> SubirImagenAsync(IFormFile archivo, string usuarioId)
    {
        var container = _blobClient.GetBlobContainerClient(_containerName);
        await container.CreateIfNotExistsAsync(PublicAccessType.Blob);

        var extension = Path.GetExtension(archivo.FileName);
        var nombreBlob = $"{usuarioId}/{Guid.NewGuid()}{extension}";
        var blob = container.GetBlobClient(nombreBlob);

        await blob.UploadAsync(archivo.OpenReadStream(), new BlobHttpHeaders
        {
            ContentType = archivo.ContentType
        });

        return blob.Uri.ToString();
    }
}
```

---

## Fase 4 — Controllers

```csharp
// API/Controllers/PaginasController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PaginasController : ControllerBase
{
    private readonly IPaginaService _paginaService;
    private readonly AzureBlobService _blobService;

    public PaginasController(IPaginaService paginaService, AzureBlobService blobService)
    {
        _paginaService = paginaService;
        _blobService = blobService;
    }

    [HttpGet]
    public async Task<IActionResult> ObtenerArbol()
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var paginas = await _paginaService.ObtenerArbolAsync(usuarioId);
        return Ok(paginas);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> Obtener(Guid id)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var pagina = await _paginaService.ObtenerConBloquesAsync(id, usuarioId);
        return Ok(pagina);
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearPaginaDto dto)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var pagina = await _paginaService.CrearAsync(usuarioId, dto.PadreId);
        return Ok(pagina);
    }

    [HttpPatch("{id}/titulo")]
    public async Task<IActionResult> ActualizarTitulo(Guid id, [FromBody] string titulo)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        await _paginaService.ActualizarTituloAsync(id, titulo, usuarioId);
        return NoContent();
    }

    [HttpPost("imagen")]
    public async Task<IActionResult> SubirImagen(IFormFile archivo)
    {
        var usuarioId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;
        var url = await _blobService.SubirImagenAsync(archivo, usuarioId);
        return Ok(new { url });
    }
}

// API/Controllers/BloquesController.cs
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class BloquesController : ControllerBase
{
    private readonly IBloqueService _bloqueService;

    public BloquesController(IBloqueService bloqueService)
    {
        _bloqueService = bloqueService;
    }

    [HttpPost]
    public async Task<IActionResult> Crear([FromBody] CrearBloqueDto dto)
    {
        var bloque = await _bloqueService.CrearBloqueAsync(dto.PaginaId, dto.Tipo, dto.Orden);
        return Ok(bloque);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Actualizar(Guid id, [FromBody] object contenido)
    {
        await _bloqueService.ActualizarContenidoAsync(id, contenido);
        return NoContent();
    }

    [HttpPut("reordenar/{paginaId}")]
    public async Task<IActionResult> Reordenar(Guid paginaId, [FromBody] List<Guid> ordenIds)
    {
        await _bloqueService.ReordenarBloquesAsync(paginaId, ordenIds);
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(Guid id)
    {
        await _bloqueService.EliminarBloqueAsync(id);
        return NoContent();
    }
}
```

---

## Fase 5 — Frontend React (fragmento clave)

```tsx
// Editor.tsx
import EditorJS from '@editorjs/editorjs';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

export default function Editor({ paginaId }: { paginaId: string }) {
  const [bloques, setBloques] = useState<Bloque[]>([]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = bloques.findIndex(b => b.id === active.id);
      const newIndex = bloques.findIndex(b => b.id === over.id);
      const nuevaOrden = arrayMove(bloques, oldIndex, newIndex);
      setBloques(nuevaOrden);
      await fetch(`/api/bloques/reordenar/${paginaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(nuevaOrden.map(b => b.id))
      });
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={bloques.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {bloques.map(bloque => (
          <BloqueEditor key={bloque.id} bloque={bloque} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

---

## Endpoints principales

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/paginas` | Árbol de páginas del usuario |
| GET | `/api/paginas/{id}` | Página con todos sus bloques |
| POST | `/api/paginas` | Crear nueva página |
| PATCH | `/api/paginas/{id}/titulo` | Actualizar título |
| POST | `/api/paginas/imagen` | Subir imagen a Azure Blob |
| POST | `/api/bloques` | Agregar bloque a página |
| PUT | `/api/bloques/{id}` | Actualizar contenido de bloque |
| PUT | `/api/bloques/reordenar/{paginaId}` | Reordenar bloques (drag & drop) |
| DELETE | `/api/bloques/{id}` | Eliminar bloque |

---

## Lo que más impresiona a reclutadores

- Sistema de bloques extensible (fácil agregar nuevos tipos)
- Drag & drop con persistencia real en base de datos
- Páginas anidadas con árbol de navegación
- Upload de archivos a Azure Blob Storage
- Separación limpia de responsabilidades (SOLID aplicado)

---

*Duración estimada: 4–5 semanas a tiempo parcial*
