using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPlus.Modules.Production.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddProductionSubtasks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SubtasksJson",
                schema: "production",
                table: "items",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SubtasksJson",
                schema: "production",
                table: "items");
        }
    }
}
