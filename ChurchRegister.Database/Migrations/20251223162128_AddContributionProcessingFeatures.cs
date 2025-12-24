using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddContributionProcessingFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropColumn(
                name: "TranscationRef",
                table: "ChurchMemberContributions");

            migrationBuilder.AddColumn<bool>(
                name: "IsProcessed",
                table: "HSBCBankCreditTransactions",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "ChurchMemberContributions",
                type: "decimal(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(10,2)");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "ChurchMemberContributions",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "HSBCBankCreditTransactionId",
                table: "ChurchMemberContributions",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TransactionRef",
                table: "ChurchMemberContributions",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_HSBCBankCreditTransactions_IsProcessed",
                table: "HSBCBankCreditTransactions",
                column: "IsProcessed");

            migrationBuilder.CreateIndex(
                name: "IX_HSBCBankCreditTransactions_Reference",
                table: "HSBCBankCreditTransactions",
                column: "Reference");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_BankReference_Unique",
                table: "ChurchMembers",
                column: "BankReference",
                unique: true,
                filter: "[BankReference] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_Date",
                table: "ChurchMemberContributions",
                column: "Date");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId_Unique",
                table: "ChurchMemberContributions",
                column: "HSBCBankCreditTransactionId",
                unique: true,
                filter: "[HSBCBankCreditTransactionId] IS NOT NULL");

            migrationBuilder.AddCheckConstraint(
                name: "CK_ChurchMemberContributions_Amount",
                table: "ChurchMemberContributions",
                sql: "Amount >= 0");

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberContributions",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberContributions_HSBCBankCreditTransactions_HSBCBankCreditTransactionId",
                table: "ChurchMemberContributions",
                column: "HSBCBankCreditTransactionId",
                principalTable: "HSBCBankCreditTransactions",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropForeignKey(
                name: "FK_ChurchMemberContributions_HSBCBankCreditTransactions_HSBCBankCreditTransactionId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropIndex(
                name: "IX_HSBCBankCreditTransactions_IsProcessed",
                table: "HSBCBankCreditTransactions");

            migrationBuilder.DropIndex(
                name: "IX_HSBCBankCreditTransactions_Reference",
                table: "HSBCBankCreditTransactions");

            migrationBuilder.DropIndex(
                name: "IX_ChurchMembers_BankReference_Unique",
                table: "ChurchMembers");

            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberContributions_Date",
                table: "ChurchMemberContributions");

            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberContributions_HSBCTransactionId_Unique",
                table: "ChurchMemberContributions");

            migrationBuilder.DropCheckConstraint(
                name: "CK_ChurchMemberContributions_Amount",
                table: "ChurchMemberContributions");

            migrationBuilder.DropColumn(
                name: "IsProcessed",
                table: "HSBCBankCreditTransactions");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "ChurchMemberContributions");

            migrationBuilder.DropColumn(
                name: "HSBCBankCreditTransactionId",
                table: "ChurchMemberContributions");

            migrationBuilder.DropColumn(
                name: "TransactionRef",
                table: "ChurchMemberContributions");

            migrationBuilder.AlterColumn<decimal>(
                name: "Amount",
                table: "ChurchMemberContributions",
                type: "decimal(10,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "decimal(18,2)");

            migrationBuilder.AddColumn<string>(
                name: "TranscationRef",
                table: "ChurchMemberContributions",
                type: "nvarchar(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                table: "ChurchMemberContributions",
                column: "ChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
