using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ERPlus.Modules.Identity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "identity");

            migrationBuilder.CreateTable(
                name: "role_permissions",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    RoleName = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Resource = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CanView = table.Column<bool>(type: "boolean", nullable: false),
                    CanEdit = table.Column<bool>(type: "boolean", nullable: false),
                    CanDelete = table.Column<bool>(type: "boolean", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_role_permissions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Email = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    PasswordHash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    Role = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Initials = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false),
                    IsActive = table.Column<bool>(type: "boolean", nullable: false),
                    LastLoginAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                schema: "identity",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    UserId = table.Column<int>(type: "integer", nullable: false),
                    Token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    ExpiresAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    RevokedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_UserId",
                        column: x => x.UserId,
                        principalSchema: "identity",
                        principalTable: "users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                schema: "identity",
                table: "role_permissions",
                columns: new[] { "Id", "CanDelete", "CanEdit", "CanView", "CreatedAt", "IsDeleted", "Resource", "RoleName", "UpdatedAt" },
                values: new object[,]
                {
                    { 1, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "dashboard", "Operador Master", null },
                    { 2, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "agenda", "Operador Master", null },
                    { 3, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "contatos", "Operador Master", null },
                    { 4, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "financeiro", "Operador Master", null },
                    { 5, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "comercial", "Operador Master", null },
                    { 6, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "empreendimentos", "Operador Master", null },
                    { 7, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "producao", "Operador Master", null },
                    { 8, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "suporte", "Operador Master", null },
                    { 9, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "configuracoes", "Operador Master", null },
                    { 10, true, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "relatorios", "Operador Master", null },
                    { 11, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "dashboard", "Colaborador", null },
                    { 12, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "agenda", "Colaborador", null },
                    { 13, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "contatos", "Colaborador", null },
                    { 14, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "financeiro", "Colaborador", null },
                    { 15, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "comercial", "Colaborador", null },
                    { 16, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "empreendimentos", "Colaborador", null },
                    { 17, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "producao", "Colaborador", null },
                    { 18, false, true, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "suporte", "Colaborador", null },
                    { 19, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "configuracoes", "Colaborador", null },
                    { 20, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "relatorios", "Colaborador", null },
                    { 21, false, false, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "dashboard", "Visitante", null },
                    { 22, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "agenda", "Visitante", null },
                    { 23, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "contatos", "Visitante", null },
                    { 24, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "financeiro", "Visitante", null },
                    { 25, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "comercial", "Visitante", null },
                    { 26, false, false, true, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "empreendimentos", "Visitante", null },
                    { 27, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "producao", "Visitante", null },
                    { 28, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "suporte", "Visitante", null },
                    { 29, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "configuracoes", "Visitante", null },
                    { 30, false, false, false, new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), false, "relatorios", "Visitante", null }
                });

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_Token",
                schema: "identity",
                table: "refresh_tokens",
                column: "Token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_UserId",
                schema: "identity",
                table: "refresh_tokens",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_role_permissions_RoleName_Resource",
                schema: "identity",
                table: "role_permissions",
                columns: new[] { "RoleName", "Resource" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_Email",
                schema: "identity",
                table: "users",
                column: "Email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "refresh_tokens",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "role_permissions",
                schema: "identity");

            migrationBuilder.DropTable(
                name: "users",
                schema: "identity");
        }
    }
}
