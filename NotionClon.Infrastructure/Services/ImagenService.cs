using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;

namespace NotionClon.Infrastructure.Services;

public class ImagenService
{
    private readonly IWebHostEnvironment _env;

    public ImagenService(IWebHostEnvironment env)
    {
        _env = env;
    }

    public async Task<string> GuardarAsync(IFormFile archivo, string usuarioId)
    {
        var extensionesPermitidas = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
        var ext = Path.GetExtension(archivo.FileName).ToLowerInvariant();

        if (!extensionesPermitidas.Contains(ext))
            throw new InvalidOperationException("Tipo de archivo no permitido");

        if (archivo.Length > 10 * 1024 * 1024)
            throw new InvalidOperationException("El archivo supera el límite de 10 MB");

        var carpeta = Path.Combine(_env.WebRootPath, "uploads", usuarioId);
        Directory.CreateDirectory(carpeta);

        var nombreArchivo = $"{Guid.NewGuid()}{ext}";
        var rutaCompleta = Path.Combine(carpeta, nombreArchivo);

        using var stream = File.Create(rutaCompleta);
        await archivo.CopyToAsync(stream);

        return $"/uploads/{usuarioId}/{nombreArchivo}";
    }
}
