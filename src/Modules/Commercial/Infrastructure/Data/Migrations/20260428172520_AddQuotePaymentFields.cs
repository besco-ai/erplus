using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ERPlus.Modules.Commercial.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddQuotePaymentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_quotes_deals_DealId",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.AlterColumn<int>(
                name: "DealId",
                schema: "commercial",
                table: "quotes",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<DateTime>(
                name: "DataPrimeiroPagamento",
                schema: "commercial",
                table: "quotes",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "FormaPagamento",
                schema: "commercial",
                table: "quotes",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NumeroParcelas",
                schema: "commercial",
                table: "quotes",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Observacoes",
                schema: "commercial",
                table: "quotes",
                type: "text",
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_quotes_deals_DealId",
                schema: "commercial",
                table: "quotes",
                column: "DealId",
                principalSchema: "commercial",
                principalTable: "deals",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_quotes_deals_DealId",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.DropColumn(
                name: "DataPrimeiroPagamento",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.DropColumn(
                name: "FormaPagamento",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.DropColumn(
                name: "NumeroParcelas",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.DropColumn(
                name: "Observacoes",
                schema: "commercial",
                table: "quotes");

            migrationBuilder.AlterColumn<int>(
                name: "DealId",
                schema: "commercial",
                table: "quotes",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_quotes_deals_DealId",
                schema: "commercial",
                table: "quotes",
                column: "DealId",
                principalSchema: "commercial",
                principalTable: "deals",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
