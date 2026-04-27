using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPlus.Modules.Tasks.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskRecurrenceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Recurrence",
                schema: "tasks",
                table: "tasks",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceId",
                schema: "tasks",
                table: "tasks",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Recurrence",
                schema: "tasks",
                table: "tasks");

            migrationBuilder.DropColumn(
                name: "RecurrenceId",
                schema: "tasks",
                table: "tasks");
        }
    }
}
