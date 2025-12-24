using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddEnvelopeContributionBatch : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "EnvelopeContributionBatchId",
                table: "ChurchMemberContributions",
                type: "int",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "EnvelopeContributionBatches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    BatchDate = table.Column<DateOnly>(type: "date", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    EnvelopeCount = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Submitted"),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EnvelopeContributionBatches", x => x.Id);
                    table.CheckConstraint("CK_EnvelopeContributionBatch_EnvelopeCount", "EnvelopeCount > 0");
                    table.CheckConstraint("CK_EnvelopeContributionBatch_TotalAmount", "TotalAmount >= 0");
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_EnvelopeContributionBatchId",
                table: "ChurchMemberContributions",
                column: "EnvelopeContributionBatchId");

            migrationBuilder.CreateIndex(
                name: "IX_EnvelopeContributionBatch_BatchDate_Unique",
                table: "EnvelopeContributionBatches",
                column: "BatchDate",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberContributions_EnvelopeContributionBatches_EnvelopeContributionBatchId",
                table: "ChurchMemberContributions",
                column: "EnvelopeContributionBatchId",
                principalTable: "EnvelopeContributionBatches",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchMemberContributions_EnvelopeContributionBatches_EnvelopeContributionBatchId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropTable(
                name: "EnvelopeContributionBatches");

            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberContributions_EnvelopeContributionBatchId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropColumn(
                name: "EnvelopeContributionBatchId",
                table: "ChurchMemberContributions");
        }
    }
}
