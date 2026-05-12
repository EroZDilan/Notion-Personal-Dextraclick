using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using NotionClon.Core.Entities;

namespace NotionClon.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<IdentityUser>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Pagina> Paginas => Set<Pagina>();
    public DbSet<Bloque> Bloques => Set<Bloque>();
    public DbSet<VersionBloque> VersionesBloque => Set<VersionBloque>();
    public DbSet<Comentario> Comentarios => Set<Comentario>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Pagina>(e =>
        {
            e.HasKey(p => p.Id);
            e.Property(p => p.Titulo).HasMaxLength(500);
            e.Property(p => p.Emoji).HasMaxLength(10);
            e.Property(p => p.UsuarioId).IsRequired();

            e.HasOne(p => p.PaginaPadre)
                .WithMany(p => p.SubPaginas)
                .HasForeignKey(p => p.PaginaPadreId)
                .OnDelete(DeleteBehavior.Restrict);

            e.HasMany(p => p.Bloques)
                .WithOne(b => b.Pagina)
                .HasForeignKey(b => b.PaginaId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasIndex(p => p.UsuarioId);
        });

        builder.Entity<Bloque>(e =>
        {
            e.HasKey(b => b.Id);
            e.Property(b => b.ContenidoJson).HasColumnType("TEXT");

            e.HasMany(b => b.Versiones)
                .WithOne(v => v.Bloque)
                .HasForeignKey(v => v.BloqueId)
                .OnDelete(DeleteBehavior.Cascade);

            e.HasMany(b => b.Comentarios)
                .WithOne(c => c.Bloque)
                .HasForeignKey(c => c.BloqueId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<VersionBloque>(e =>
        {
            e.HasKey(v => v.Id);
            e.Property(v => v.ContenidoJson).HasColumnType("TEXT");
            e.HasIndex(v => v.BloqueId);
        });

        builder.Entity<Comentario>(e =>
        {
            e.HasKey(c => c.Id);
            e.Property(c => c.Texto).HasMaxLength(2000);
            e.HasIndex(c => c.BloqueId);
        });
    }
}
