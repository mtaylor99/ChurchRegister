using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRegisterNumberIndexesAndOptimizations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<int>(
                name: "Year",
                table: "ChurchMemberRegisterNumbers",
                type: "int",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "int",
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "Number",
                table: "ChurchMemberRegisterNumbers",
                type: "nvarchar(10)",
                maxLength: 10,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year",
                table: "ChurchMemberRegisterNumbers",
                column: "Year");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year_Number",
                table: "ChurchMemberRegisterNumbers",
                columns: new[] { "Year", "Number" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year",
                table: "ChurchMemberRegisterNumbers");

            migrationBuilder.DropIndex(
                name: "IX_ChurchMemberRegisterNumbers_Year_Number",
                table: "ChurchMemberRegisterNumbers");

            migrationBuilder.AlterColumn<int>(
                name: "Year",
                table: "ChurchMemberRegisterNumbers",
                type: "int",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.AlterColumn<string>(
                name: "Number",
                table: "ChurchMemberRegisterNumbers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(10)",
                oldMaxLength: 10,
                oldNullable: true);
        }
    }
}
