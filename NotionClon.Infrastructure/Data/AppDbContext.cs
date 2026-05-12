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
        });
    }
}
