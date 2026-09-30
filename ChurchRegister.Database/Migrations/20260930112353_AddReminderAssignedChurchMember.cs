using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddReminderAssignedChurchMember : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AssignedToChurchMemberId",
                table: "Reminders",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Reminders_AssignedToChurchMemberId",
                table: "Reminders",
                column: "AssignedToChurchMemberId");

            migrationBuilder.AddForeignKey(
                name: "FK_Reminders_ChurchMembers_AssignedToChurchMemberId",
                table: "Reminders",
                column: "AssignedToChurchMemberId",
                principalTable: "ChurchMembers",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Reminders_ChurchMembers_AssignedToChurchMemberId",
                table: "Reminders");

            migrationBuilder.DropIndex(
                name: "IX_Reminders_AssignedToChurchMemberId",
                table: "Reminders");

            migrationBuilder.DropColumn(
                name: "AssignedToChurchMemberId",
                table: "Reminders");
        }
    }
}
