using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NotionClon.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddVersionesComentariosCover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CoverUrl",
                table: "Paginas",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "EsPublica",
                table: "Paginas",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "Comentarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BloqueId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<string>(type: "TEXT", nullable: false),
                    NombreUsuario = table.Column<string>(type: "TEXT", nullable: false),
                    Texto = table.Column<string>(type: "TEXT", maxLength: 2000, nullable: false),
                    CreadaEn = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comentarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comentarios_Bloques_BloqueId",
                        column: x => x.BloqueId,
                        principalTable: "Bloques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "VersionesBloque",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    BloqueId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ContenidoJson = table.Column<string>(type: "TEXT", nullable: false),
                    TipoStr = table.Column<string>(type: "TEXT", nullable: false),
                    CreadaEn = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VersionesBloque", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VersionesBloque_Bloques_BloqueId",
                        column: x => x.BloqueId,
                        principalTable: "Bloques",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_BloqueId",
                table: "Comentarios",
                column: "BloqueId");

            migrationBuilder.CreateIndex(
                name: "IX_VersionesBloque_BloqueId",
                table: "VersionesBloque",
                column: "BloqueId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Comentarios");

            migrationBuilder.DropTable(
                name: "VersionesBloque");

            migrationBuilder.DropColumn(
                name: "CoverUrl",
                table: "Paginas");

            migrationBuilder.DropColumn(
                name: "EsPublica",
                table: "Paginas");
        }
    }
}
