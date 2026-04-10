using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBankReferenceUniqueConstraint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChurchMembers_BankReference_Unique",
                table: "ChurchMembers");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_BankReference",
                table: "ChurchMembers",
                column: "BankReference",
                filter: "[BankReference] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChurchMembers_BankReference",
                table: "ChurchMembers");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_BankReference_Unique",
                table: "ChurchMembers",
                column: "BankReference",
                unique: true,
                filter: "[BankReference] IS NOT NULL");
        }
    }
}
