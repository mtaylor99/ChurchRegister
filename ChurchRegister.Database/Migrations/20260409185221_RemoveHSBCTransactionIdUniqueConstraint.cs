using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class RemoveHSBCTransactionIdUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId_Unique",
                table: "ChurchMemberContributions");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId",
                table: "ChurchMemberContributions",
                column: "HSBCBankCreditTransactionId",
                filter: "[HSBCBankCreditTransactionId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId",
                table: "ChurchMemberContributions");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId_Unique",
                table: "ChurchMemberContributions",
                column: "HSBCBankCreditTransactionId",
                unique: true,
                filter: "[HSBCBankCreditTransactionId] IS NOT NULL");
        }
    }
}
