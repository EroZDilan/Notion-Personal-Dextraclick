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

---
---

# Estado actual del proyecto (implementación real)

> Lo que sigue documenta el sistema tal como está construido y funcionando hoy.

---

## Stack real implementado

| Capa | Tecnología |
|------|-----------|
| Backend | ASP.NET Core 8 Web API, puerto 5162 |
| Base de datos | **SQLite** + Entity Framework Core (archivo `notionclondb.sqlite`) |
| Auth | ASP.NET Identity + JWT HS256, tokens de 30 días |
| Almacenamiento de imágenes | **Local en `wwwroot/imagenes/`** (sin dependencia cloud) |
| Frontend | React 19 + TypeScript + Vite, puerto 5173 |
| Editor de bloques | Implementación propia con `contentEditable` + dnd-kit |
| Asistente IA | **Electron 33** (app de escritorio externa, bandeja del sistema) |
| Modelo IA | **GitHub Models API** — `gpt-4o-mini` (gratis, 150 req/día) |
| Plataformas | Linux (Wayland/X11) y Windows |

---

## Estructura real del proyecto

```
Notion-Personal-Dextraclick/
├── NotionClon.sln
├── start.sh                        ← Arranque Linux (backend + frontend + asistente)
├── start.bat                       ← Arranque Windows
│
├── NotionClon.Core/                ← Dominio puro
│   ├── Entities/
│   │   ├── Pagina.cs               ← EsPublica, CoverUrl añadidos
│   │   ├── Bloque.cs               ← Tiene Versiones y Comentarios
│   │   ├── TipoBloque.cs           ← 11 tipos de bloque
│   │   ├── VersionBloque.cs        ← Historial de cambios por bloque
│   │   └── Comentario.cs           ← Comentarios anclados a bloques
│   ├── Interfaces/
│   │   ├── IPaginaService.cs
│   │   ├── IBloqueService.cs
│   │   ├── IComentarioService.cs
│   │   └── IChatService.cs
│   └── DTOs/
│       ├── PaginaDto.cs
│       ├── BloqueDto.cs
│       ├── AuthDtos.cs
│       └── ChatDtos.cs
│
├── NotionClon.Infrastructure/      ← Implementaciones
│   ├── Data/
│   │   └── AppDbContext.cs
│   └── Services/
│       ├── PaginaService.cs
│       ├── BloqueService.cs
│       ├── ComentarioService.cs
│       ├── ImagenService.cs        ← Guarda imágenes localmente en wwwroot
│       └── ChatService.cs          ← Loop agéntico con GitHub Models API
│
├── NotionClon.API/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── PaginasController.cs
│   │   ├── BloquesController.cs
│   │   ├── ComentariosController.cs
│   │   ├── VersionesController.cs
│   │   ├── PublicoController.cs    ← Endpoint sin auth para páginas públicas
│   │   └── ChatController.cs
│   ├── Properties/launchSettings.json
│   ├── appsettings.json
│   ├── appsettings.Development.json  ← API key real (gitignoreado)
│   └── Program.cs
│
├── notion-clon-client/             ← Frontend React 19 + TypeScript + Vite
│   └── src/
│       ├── api/                    ← Clientes HTTP tipados
│       ├── components/
│       │   ├── Editor/             ← Editor principal de bloques
│       │   │   ├── EditorPage.tsx
│       │   │   ├── BloqueEditor.tsx
│       │   │   ├── bloques/        ← Componentes por tipo de bloque
│       │   │   ├── SlashMenu.tsx
│       │   │   ├── EditorCover.tsx
│       │   │   ├── ComentariosPanel.tsx
│       │   │   ├── VersionesPanel.tsx
│       │   │   └── ShareModal.tsx
│       │   ├── Sidebar/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── PaginaItem.tsx  ← Árbol recursivo con subpáginas
│       │   │   └── Papelera.tsx
│       │   ├── BusquedaModal.tsx
│       │   └── TemplatesModal.tsx
│       ├── contexts/
│       │   ├── AuthContext.tsx
│       │   └── ThemeContext.tsx    ← Tema claro/oscuro
│       ├── hooks/
│       │   └── usePaginas.ts
│       ├── pages/
│       │   ├── Login.tsx
│       │   ├── Register.tsx
│       │   ├── Workspace.tsx       ← Layout principal
│       │   └── PaginaPublica.tsx   ← Vista pública (sin login)
│       └── utils/
│           └── exportMarkdown.ts   ← Exportador a .md
│
└── notion-clon-assistant/          ← App Electron (bandeja del sistema)
    ├── main.js                     ← Proceso principal: tray + ventana
    ├── preload.js                  ← contextBridge (IPC seguro)
    ├── renderer/
    │   ├── index.html
    │   ├── renderer.js             ← Login, chat, confirmación
    │   └── style.css               ← Tema oscuro
    └── assets/
        └── icon.png
```

---

## Entidades del dominio (estado real)

### `Pagina`
```csharp
public class Pagina
{
    public Guid Id { get; set; }
    public string Titulo { get; set; } = "Sin título";
    public string Emoji { get; set; } = "📄";
    public string? CoverUrl { get; set; }       // imagen de portada (banner superior)
    public bool EsPublica { get; set; }          // compartir sin login
    public string UsuarioId { get; set; }        // aislamiento por usuario
    public Guid? PaginaPadreId { get; set; }     // jerarquía anidada
    public bool Archivada { get; set; }          // papelera (soft delete)
    public DateTime CreadaEn { get; set; }
    public DateTime ActualizadaEn { get; set; }
    public ICollection<Pagina> SubPaginas { get; set; }
    public ICollection<Bloque> Bloques { get; set; }
}
```

### `Bloque`
```csharp
public class Bloque
{
    public Guid Id { get; set; }
    public Guid PaginaId { get; set; }
    public TipoBloque Tipo { get; set; }
    public string ContenidoJson { get; set; } = "{}";  // JSON específico por tipo
    public int Orden { get; set; }
    public DateTime ActualizadoEn { get; set; }
    public ICollection<VersionBloque> Versiones { get; set; }   // historial
    public ICollection<Comentario> Comentarios { get; set; }    // comentarios
}
```

### `VersionBloque`
```csharp
public class VersionBloque
{
    public Guid Id { get; set; }
    public Guid BloqueId { get; set; }
    public string ContenidoJson { get; set; }   // snapshot del contenido
    public string TipoStr { get; set; }          // tipo como string en el momento
    public DateTime CreadaEn { get; set; }
}
```

### `Comentario`
```csharp
public class Comentario
{
    public Guid Id { get; set; }
    public Guid BloqueId { get; set; }           // anclado a un bloque específico
    public string UsuarioId { get; set; }
    public string NombreUsuario { get; set; }
    public string Texto { get; set; }
    public DateTime CreadaEn { get; set; }
}
```

### Tipos de bloque disponibles
```csharp
public enum TipoBloque
{
    Parrafo,        // texto enriquecido (negrita, cursiva, código inline)
    Heading1,       // título grande  →  <h1>
    Heading2,       // título mediano →  <h2>
    Heading3,       // título pequeño →  <h3>
    ListaBullets,   // lista con viñetas
    ListaNumerada,  // lista numerada
    Codigo,         // bloque de código con lenguaje y resaltado
    Imagen,         // imagen con URL y texto alternativo
    Divisor,        // línea horizontal separadora
    Llamada,        // callout con emoji y color de fondo
    Cita            // blockquote
}
```

---

## API REST completa

### Autenticación — `/api/auth` (sin token)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/auth/register` | Registrar usuario nuevo → devuelve JWT |
| POST | `/api/auth/login` | Login con email y contraseña → devuelve JWT |

**JWT:** HS256, 30 días de validez. Claims: `NameIdentifier` (userId), `Email`, `Name`, `Jti`.

---

### Páginas — `/api/paginas` (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/paginas` | Árbol completo de páginas del usuario (sólo no archivadas) |
| GET | `/api/paginas/buscar?q=texto` | Búsqueda en títulos y contenido de bloques |
| GET | `/api/paginas/papelera` | Lista de páginas archivadas (papelera) |
| GET | `/api/paginas/{id}` | Página con todos sus bloques ordenados |
| POST | `/api/paginas` | Crear página nueva (opcionalmente como subpágina con `padreId`) |
| PATCH | `/api/paginas/{id}` | Actualizar título y emoji |
| PATCH | `/api/paginas/{id}/cover` | Establecer imagen de portada (URL) |
| PATCH | `/api/paginas/{id}/visibilidad` | Hacer página pública o privada |
| DELETE | `/api/paginas/{id}` | Archivar página (soft delete → va a papelera) |
| POST | `/api/paginas/{id}/restaurar` | Restaurar página desde la papelera |
| POST | `/api/paginas/imagen` | Subir imagen → se guarda en `wwwroot/imagenes/` |

---

### Bloques — `/api/bloques` (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/bloques` | Crear bloque en una página con tipo y posición |
| PUT | `/api/bloques/{id}` | Actualizar contenido de un bloque (guarda versión previa) |
| PUT | `/api/bloques/reordenar/{paginaId}` | Reordenar bloques (array de IDs en nuevo orden) |
| DELETE | `/api/bloques/{id}` | Eliminar bloque (verifica que el usuario sea propietario) |

---

### Comentarios — `/api/comentarios` (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/comentarios/bloque/{bloqueId}` | Obtener comentarios de un bloque |
| POST | `/api/comentarios` | Agregar comentario a un bloque |
| DELETE | `/api/comentarios/{id}` | Eliminar propio comentario |

---

### Versiones — `/api/versiones` (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/versiones/bloque/{bloqueId}` | Historial de versiones de un bloque |
| POST | `/api/versiones/{id}/restaurar` | Restaurar bloque a una versión anterior |

---

### Público — `/api/publico` (sin autenticación)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/api/publico/paginas/{id}` | Ver página pública (solo si `EsPublica = true`) |

---

### Chat IA — `/api/chat` (requiere JWT)

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/chat` | Enviar mensaje al asistente IA |

**Request:**
```json
{
  "Mensaje": "Crea una página llamada Ideas 2025",
  "ConfirmarAccionPendiente": null
}
```

**Response:**
```json
{
  "Respuesta": "He creado la página \"Ideas 2025\".",
  "AccionesEjecutadas": [
    {
      "Tipo": "create_page",
      "Descripcion": "Página creada: 📄 Ideas 2025",
      "PaginaId": "a1b2c3d4-..."
    }
  ],
  "AccionPendiente": null
}
```

---

## Sistema de chat IA — ChatService

El `ChatService` implementa un **loop agéntico** que conecta el lenguaje natural con el sistema de páginas y bloques.

### Funcionamiento

1. En cada mensaje se incluye el árbol de páginas actual en el system prompt
2. Se llama a GitHub Models API con el modelo `gpt-4o-mini`
3. El modelo puede invocar herramientas (tools) para leer o modificar datos
4. Por cada tool call se ejecuta la acción correspondiente y se devuelve el resultado al modelo
5. El loop se repite hasta que el modelo responde en lenguaje natural (máximo 10 iteraciones)
6. Las acciones destructivas detienen el loop y devuelven una `AccionPendiente` para que el usuario confirme

### Herramientas disponibles (9 tools)

| Tool | Qué hace | ¿Requiere confirmación? |
|------|----------|------------------------|
| `get_page_tree` | Lee el árbol completo de páginas | No |
| `get_page_content` | Lee página con todos sus bloques e IDs | No |
| `search_pages` | Busca por texto en páginas y bloques | No |
| `create_page` | Crea nueva página con título, emoji y padre opcional | No |
| `update_page_title` | Cambia título y emoji de una página | No |
| `create_block` | Añade bloque a una página en una posición | No |
| `update_block` | Modifica el contenido de un bloque existente | No |
| `delete_block` | Elimina un bloque | **Sí — pide confirmación** |
| `archive_page` | Archiva una página (la manda a papelera) | **Sí — pide confirmación** |

### Flujo de confirmación para acciones destructivas

```
Usuario: "borra el primer bloque de mi página de ideas"
  ↓
IA invoca delete_block
  ↓
ChatService devuelve AccionPendiente (no ejecuta)
  ↓
Asistente Electron muestra: [Confirmar] [Cancelar]
  ↓
Usuario confirma
  ↓
Frontend reenvía { ConfirmarAccionPendiente: { Tipo, Parametros } }
  ↓
ChatService ejecuta la eliminación → "Bloque eliminado."
```

### Proveedor IA

- **API:** GitHub Models (`https://models.inference.ai.azure.com`)
- **Modelo:** `gpt-4o-mini`
- **Plan gratuito:** 150 requests/día, 15/minuto
- **Formato:** OpenAI-compatible (tool_calls, finish_reason, etc.)
- **Clave:** en `appsettings.Development.json` (gitignoreado)

---

## Frontend React — funcionalidades implementadas

### Autenticación
- Registro e inicio de sesión con email y contraseña
- Token JWT almacenado en `localStorage`
- Contexto global `AuthContext` con logout
- Redirección automática si no hay sesión

### Espacio de trabajo (`Workspace`)
- Layout de dos columnas: sidebar izquierdo + editor principal
- Al seleccionar una página en el sidebar se carga su editor
- Las nuevas páginas abren automáticamente en el editor

### Sidebar
- Árbol de páginas anidadas (recursivo, con subpáginas colapsables)
- Botón de crear página raíz y subpáginas desde el árbol
- Renombrado inline de páginas
- Mover páginas a la papelera
- Botón de búsqueda con atajo `Ctrl+K`
- Botón de papelera para ver/restaurar páginas archivadas
- Toggle de tema claro/oscuro
- Nombre del usuario y botón de logout

### Editor de página
- **Imagen de portada** (cover): banner en la parte superior, click para cambiar URL
- **Emoji de página**: editable junto al título
- **Título editable** con autoguardado (debounce 1 s)
- **11 tipos de bloques** editables con `contentEditable`
- **Texto enriquecido:** negrita, cursiva, tachado, código inline (via `execCommand` y selección)
- **Slash menu** `/`: escribe `/` en cualquier bloque para ver el menú de tipos de bloque
- **Drag & drop** de bloques para reordenar (dnd-kit), persiste en base de datos
- **Autoguardado** de contenido de bloques (debounce 1,5 s)
- **Panel de comentarios** por bloque: abrir/ver/agregar/eliminar comentarios
- **Panel de versiones** por bloque: ver historial y restaurar versiones anteriores
- **Exportar a Markdown**: descarga el contenido de la página como `.md` con formato correcto
- **Compartir**: modal para hacer la página pública y copiar el enlace de vista pública

### Búsqueda (`Ctrl+K`)
- Modal de búsqueda en tiempo real
- Busca en títulos de páginas y en el contenido de los bloques
- Click en resultado navega directamente a esa página

### Papelera
- Panel deslizable desde el sidebar
- Lista páginas archivadas con opción de restaurar o navegar

### Templates
- Modal de plantillas predefinidas: Notas de reunión, Documento de proyecto, Diario personal, y más
- Aplica la plantilla a la página actual (reemplaza el contenido)
- Cada plantilla tiene emoji, nombre y bloques preconfigurados

### Vista pública (`/p/:id`)
- Accesible sin login si la página tiene `EsPublica = true`
- Muestra la página en modo lectura con todos sus bloques
- Si la página no existe o es privada, muestra error 404

### Tema claro/oscuro
- Toggle en el sidebar
- Persistido en `localStorage`
- Aplicado con CSS custom properties a toda la app

---

## Asistente IA — Electron app (bandeja del sistema)

Una aplicación de escritorio **completamente separada** del navegador que corre en segundo plano y permite controlar NotionClon mediante lenguaje natural.

### Arquitectura

```
notion-clon-assistant/
├── main.js       ← Proceso principal Electron: crea el tray icon y la ventana
├── preload.js    ← Puente seguro IPC: expone window.assistant al renderer
└── renderer/
    ├── index.html   ← Pantalla de login + pantalla de chat
    ├── renderer.js  ← Lógica: login, envío de mensajes, confirmaciones
    └── style.css    ← Tema oscuro
```

### Comportamiento

- Al arrancar crea un **icono en la bandeja del sistema** (system tray)
- Click en el icono → muestra/oculta la ventana flotante de chat
- La ventana es `alwaysOnTop`, `frame: false`, `380×560 px`, posicionada en la esquina inferior derecha
- No aparece en la barra de tareas
- **Health check** del backend cada 5 segundos: muestra un punto verde/rojo en el chat indicando si el backend está online
- Si el backend está offline: el chat muestra un aviso y bloquea el envío

### Flujo de usuario en el asistente

1. Primera vez: pantalla de **login** (email + contraseña → llama a `/api/auth/login`)
2. Token guardado en `localStorage` del proceso Electron
3. Pantalla de **chat**: input de texto + historial de mensajes
4. Cada mensaje se envía a `/api/chat` con el JWT
5. La respuesta muestra el texto del asistente y lista las acciones ejecutadas
6. Si hay una `AccionPendiente`: se muestra una tarjeta con descripción y botones **[Confirmar] / [Cancelar]**
7. Logout borra el token y vuelve a la pantalla de login

### Scripts de arranque

**Linux (`./start.sh`):**
```bash
#!/bin/bash
# Arranca backend, frontend y asistente en paralelo
(cd NotionClon.API && dotnet run) &
(cd notion-clon-client && npm run dev) &
(cd notion-clon-assistant && unset ELECTRON_RUN_AS_NODE && \
  ELECTRON_OZONE_PLATFORM_HINT=auto npm start) &
wait
```

**Windows (`start.bat`):**
```bat
start "Backend"      cmd /k "cd NotionClon.API && dotnet run"
start "Frontend"     cmd /k "cd notion-clon-client && npm run dev"
start "Asistente IA" cmd /k "cd notion-clon-assistant && set ELECTRON_RUN_AS_NODE= && npm start"
```

> **Nota Linux/Wayland:** es obligatorio `unset ELECTRON_RUN_AS_NODE` antes de lanzar Electron. Claude Code setea esta variable en su entorno y hace que Electron arranque en modo Node puro sin inicializar el proceso browser.

---

## Configuración del proyecto

### `appsettings.json`
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Data Source=notionclondb.sqlite"
  },
  "Jwt": {
    "Key": "NotionClonSuperSecretKey_ChangeThis_InProduction_2024!",
    "Issuer": "NotionClon.API",
    "Audience": "NotionClon.Client"
  },
  "Cors": {
    "AllowedOrigins": ["http://localhost:5173", "http://localhost:3000"]
  },
  "GitHubModels": {
    "ApiKey": "",
    "BaseUrl": "https://models.inference.ai.azure.com",
    "Model": "gpt-4o-mini"
  }
}
```

### `appsettings.Development.json` (gitignoreado — contiene la API key real)
```json
{
  "GitHubModels": {
    "ApiKey": "ghp_TU_TOKEN_DE_GITHUB_AQUI",
    "BaseUrl": "https://models.inference.ai.azure.com",
    "Model": "gpt-4o-mini"
  }
}
```

### CORS
- **FrontendPolicy:** permite `localhost:5173` y `localhost:3000`
- **ElectronPolicy:** `AllowAnyOrigin` (necesario porque Electron envía `Origin: null`)
- La app usa `ElectronPolicy` como política activa (cubre también al frontend local)

---

## Flujo de datos completo

```
Usuario en Electron           Usuario en navegador
       │                              │
       ▼                              ▼
 Login /api/auth/login         Login /api/auth/login
       │                              │
       ▼                              ▼
 JWT guardado en              JWT en localStorage
 localStorage Electron
       │
       ▼
 Mensaje: "crea una página sobre React"
       │
       ▼
 POST /api/chat { Mensaje: "..." }
       │
       ▼
 ChatService:
   1. ObtenerArbolAsync(userId) → árbol actual al system prompt
   2. GitHub Models API (gpt-4o-mini)
   3. Modelo invoca create_page(titulo="React")
   4. CrearAsync(userId) → nueva página en SQLite
   5. ActualizarTituloAsync → título "React"
   6. Devuelve al modelo: "Página creada. id:abc123"
   7. Modelo responde: "He creado la página React."
       │
       ▼
 Electron muestra respuesta + acción ejecutada
```

---

## Lo que diferencia a este proyecto

- **Sistema de bloques propio** sin dependencias externas de editor
- **Loop agéntico completo**: el asistente puede encadenar múltiples operaciones en una sola petición
- **Confirmación de acciones destructivas** para evitar borrados accidentales
- **Historial de versiones** por bloque con restauración
- **Comentarios** anclados a bloques específicos (no a la página completa)
- **Compartición de páginas** sin necesidad de crear cuenta
- **Exportación a Markdown** respetando la jerarquía y formatos
- **App de escritorio externa** que convive con la web app sin interferir
- **Arquitectura limpia**: Core (dominio puro) / Infrastructure (EF + servicios) / API (controllers)
- **Cross-platform**: funciona en Linux (Wayland/X11) y Windows
