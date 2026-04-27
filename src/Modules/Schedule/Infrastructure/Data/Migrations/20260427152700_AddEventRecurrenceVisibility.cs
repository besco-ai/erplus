using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPlus.Modules.Schedule.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddEventRecurrenceVisibility : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Recurrence",
                schema: "schedule",
                table: "events",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RecurrenceId",
                schema: "schedule",
                table: "events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RefType",
                schema: "schedule",
                table: "events",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Visibility",
                schema: "schedule",
                table: "events",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Recurrence",
                schema: "schedule",
                table: "events");

            migrationBuilder.DropColumn(
                name: "RecurrenceId",
                schema: "schedule",
                table: "events");

            migrationBuilder.DropColumn(
                name: "RefType",
                schema: "schedule",
                table: "events");

            migrationBuilder.DropColumn(
                name: "Visibility",
                schema: "schedule",
                table: "events");
        }
    }
}
