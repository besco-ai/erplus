using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPlus.Modules.CRM.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddContactCellphoneAndNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Cellphone",
                schema: "crm",
                table: "contacts",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Notes",
                schema: "crm",
                table: "contacts",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Cellphone",
                schema: "crm",
                table: "contacts");

            migrationBuilder.DropColumn(
                name: "Notes",
                schema: "crm",
                table: "contacts");
        }
    }
}
