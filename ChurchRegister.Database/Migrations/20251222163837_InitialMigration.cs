using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace ChurchRegister.Database.Migrations
{
    /// <inheritdoc />
    public partial class InitialMigration : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Addresses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NameNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    AddressLineOne = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    AddressLineTwo = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    Town = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    County = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    Postcode = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Addresses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoles",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoles", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUsers",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    FirstName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    JobTitle = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: true),
                    DateJoined = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccountStatus = table.Column<int>(type: "int", nullable: false),
                    Avatar = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedUserName = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    Email = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    NormalizedEmail = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    EmailConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    SecurityStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ConcurrencyStamp = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumber = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    PhoneNumberConfirmed = table.Column<bool>(type: "bit", nullable: false),
                    TwoFactorEnabled = table.Column<bool>(type: "bit", nullable: false),
                    LockoutEnd = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: true),
                    LockoutEnabled = table.Column<bool>(type: "bit", nullable: false),
                    AccessFailedCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUsers", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRoleTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRoleTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberStatuses",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberStatuses", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ContributionTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ContributionTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Districts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(10)", maxLength: 10, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Districts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Events",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Name = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    ShowInAnalysis = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Events", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "HSBCBankCreditTransactions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Reference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    MoneyIn = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_HSBCBankCreditTransactions", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RefreshTokens",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Token = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: false),
                    UserId = table.Column<string>(type: "nvarchar(450)", maxLength: 450, nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsRevoked = table.Column<bool>(type: "bit", nullable: false),
                    RevokedDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    RevokedByIp = table.Column<string>(type: "nvarchar(45)", maxLength: 45, nullable: true),
                    ReplacedByToken = table.Column<string>(type: "nvarchar(256)", maxLength: 256, nullable: true),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RefreshTokens", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "TrainingCertificateTypes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Type = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainingCertificateTypes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AspNetRoleClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetRoleClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetRoleClaims_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserClaims",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ClaimType = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ClaimValue = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserClaims", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AspNetUserClaims_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserLogins",
                columns: table => new
                {
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderKey = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    ProviderDisplayName = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserLogins", x => new { x.LoginProvider, x.ProviderKey });
                    table.ForeignKey(
                        name: "FK_AspNetUserLogins_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserRoles",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    RoleId = table.Column<string>(type: "nvarchar(450)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserRoles", x => new { x.UserId, x.RoleId });
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetRoles_RoleId",
                        column: x => x.RoleId,
                        principalTable: "AspNetRoles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AspNetUserRoles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AspNetUserTokens",
                columns: table => new
                {
                    UserId = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    LoginProvider = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Value = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AspNetUserTokens", x => new { x.UserId, x.LoginProvider, x.Name });
                    table.ForeignKey(
                        name: "FK_AspNetUserTokens_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    FirstName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    LastName = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    PhoneNumber = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    EmailAddress = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    BankReference = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    ChurchMemberTypeId = table.Column<int>(type: "int", nullable: true),
                    AddressId = table.Column<int>(type: "int", nullable: true),
                    ChurchMemberStatusId = table.Column<int>(type: "int", nullable: true),
                    DistrictId = table.Column<int>(type: "int", nullable: true),
                    MemberSince = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Baptised = table.Column<bool>(type: "bit", nullable: false),
                    GiftAid = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_Addresses_AddressId",
                        column: x => x.AddressId,
                        principalTable: "Addresses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_ChurchMemberStatuses_ChurchMemberStatusId",
                        column: x => x.ChurchMemberStatusId,
                        principalTable: "ChurchMemberStatuses",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_ChurchMemberTypes_ChurchMemberTypeId",
                        column: x => x.ChurchMemberTypeId,
                        principalTable: "ChurchMemberTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChurchMembers_Districts_DistrictId",
                        column: x => x.DistrictId,
                        principalTable: "Districts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "EventAttendances",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    EventId = table.Column<int>(type: "int", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Attendance = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventAttendances", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventAttendances_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberContributions",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(10,2)", nullable: false),
                    Date = table.Column<DateTime>(type: "datetime2", nullable: false),
                    TranscationRef = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    ContributionTypeId = table.Column<int>(type: "int", nullable: false),
                    Deleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberContributions", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChurchMemberContributions_ContributionTypes_ContributionTypeId",
                        column: x => x.ContributionTypeId,
                        principalTable: "ContributionTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberDataProtection",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    AllowPhotographs = table.Column<bool>(type: "bit", nullable: false),
                    AllowNewsletter = table.Column<bool>(type: "bit", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberDataProtection", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberDataProtection_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRegisterNumbers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Number = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: true),
                    Year = table.Column<int>(type: "int", nullable: true),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRegisterNumbers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberRegisterNumbers_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberRoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    ChurchMemberRoleTypeId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberRoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberRoles_ChurchMemberRoleTypes_ChurchMemberRoleTypeId",
                        column: x => x.ChurchMemberRoleTypeId,
                        principalTable: "ChurchMemberRoleTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_ChurchMemberRoles_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChurchMemberTrainingCertificates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ChurchMemberId = table.Column<int>(type: "int", nullable: false),
                    Expires = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrainingCertificateTypeId = table.Column<int>(type: "int", nullable: false),
                    CreatedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedDateTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ModifiedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    ModifiedDateTime = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChurchMemberTrainingCertificates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChurchMemberTrainingCertificates_ChurchMembers_ChurchMemberId",
                        column: x => x.ChurchMemberId,
                        principalTable: "ChurchMembers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChurchMemberTrainingCertificates_TrainingCertificateTypes_TrainingCertificateTypeId",
                        column: x => x.TrainingCertificateTypeId,
                        principalTable: "TrainingCertificateTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.InsertData(
                table: "ChurchMemberRoleTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Non-Member" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Member" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Deacon" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Auditor" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Secretary" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Treasurer" },
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Minister" },
                    { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Junior Church Leader" }
                });

            migrationBuilder.InsertData(
                table: "ChurchMemberStatuses",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Active" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Expired" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "In Glory" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "InActive" }
                });

            migrationBuilder.InsertData(
                table: "ContributionTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Cash" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Transfer" }
                });

            migrationBuilder.InsertData(
                table: "Districts",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "A" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "B" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "C" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "D" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "E" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "F" },
                    { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "G" }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Weekly Sunday morning worship service", true, null, null, "Sunday Morning Service", true },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Weekly Sunday evening worship service", true, null, null, "Sunday Evening Service", true },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Online streaming of Sunday morning service", true, null, null, "Sunday Morning Online", true },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Midweek Bible study and prayer meeting", true, null, null, "Bible Study", true },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Tuesday morning prayer and worship", true, null, null, "Tuesday Morning Service", true },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Children's service during main worship", true, null, null, "Junior Church", true }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[] { 7, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Community outreach and meal service", true, null, null, "Soup Station" });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[] { 8, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Weekly youth fellowship and activities", true, null, null, "Youth Meeting", true });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[] { 9, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Choir rehearsal and practice", true, null, null, "Choir" });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 10, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Monthly men's fellowship meeting", true, null, null, "Men's Fellowship", true },
                    { 11, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Midweek inspirational service", true, null, null, "Just A Thought", true }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name" },
                values: new object[,]
                {
                    { 12, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Evening prayer call service", true, null, null, "Sunday Evening Call" },
                    { 13, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), "Open door community service", true, null, null, "Open Door" }
                });

            migrationBuilder.InsertData(
                table: "Events",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "Description", "IsActive", "ModifiedBy", "ModifiedDateTime", "Name", "ShowInAnalysis" },
                values: new object[,]
                {
                    { 14, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, "Torch", true },
                    { 15, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, true, null, null, "Coffee Corner", true }
                });

            migrationBuilder.InsertData(
                table: "TrainingCertificateTypes",
                columns: new[] { "Id", "CreatedBy", "CreatedDateTime", "ModifiedBy", "ModifiedDateTime", "Type" },
                values: new object[,]
                {
                    { 1, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "DBS" },
                    { 2, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Safeguarding Level 2" },
                    { 3, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Safeguarding Level 3" },
                    { 4, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Food Hygiene" },
                    { 5, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "First Aid" },
                    { 6, "system", new DateTime(2025, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null, null, "Fire Marshal" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_AspNetRoleClaims_RoleId",
                table: "AspNetRoleClaims",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "RoleNameIndex",
                table: "AspNetRoles",
                column: "NormalizedName",
                unique: true,
                filter: "[NormalizedName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserClaims_UserId",
                table: "AspNetUserClaims",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserLogins_UserId",
                table: "AspNetUserLogins",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUserRoles_RoleId",
                table: "AspNetUserRoles",
                column: "RoleId");

            migrationBuilder.CreateIndex(
                name: "EmailIndex",
                table: "AspNetUsers",
                column: "NormalizedEmail");

            migrationBuilder.CreateIndex(
                name: "UserNameIndex",
                table: "AspNetUsers",
                column: "NormalizedUserName",
                unique: true,
                filter: "[NormalizedUserName] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_ChurchMemberId",
                table: "ChurchMemberContributions",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberContributions_ContributionTypeId",
                table: "ChurchMemberContributions",
                column: "ContributionTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberDataProtection_ChurchMemberId",
                table: "ChurchMemberDataProtection",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRegisterNumbers_ChurchMemberId",
                table: "ChurchMemberRegisterNumbers",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRoles_ChurchMemberId",
                table: "ChurchMemberRoles",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberRoles_ChurchMemberRoleTypeId",
                table: "ChurchMemberRoles",
                column: "ChurchMemberRoleTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_AddressId",
                table: "ChurchMembers",
                column: "AddressId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_ChurchMemberStatusId",
                table: "ChurchMembers",
                column: "ChurchMemberStatusId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_ChurchMemberTypeId",
                table: "ChurchMembers",
                column: "ChurchMemberTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMembers_DistrictId",
                table: "ChurchMembers",
                column: "DistrictId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberTrainingCertificates_ChurchMemberId",
                table: "ChurchMemberTrainingCertificates",
                column: "ChurchMemberId");

            migrationBuilder.CreateIndex(
                name: "IX_ChurchMemberTrainingCertificates_TrainingCertificateTypeId",
                table: "ChurchMemberTrainingCertificates",
                column: "TrainingCertificateTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_EventAttendance_EventId_Date",
                table: "EventAttendances",
                columns: new[] { "EventId", "Date" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AspNetRoleClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserClaims");

            migrationBuilder.DropTable(
                name: "AspNetUserLogins");

            migrationBuilder.DropTable(
                name: "AspNetUserRoles");

            migrationBuilder.DropTable(
                name: "AspNetUserTokens");

            migrationBuilder.DropTable(
                name: "ChurchMemberContributions");

            migrationBuilder.DropTable(
                name: "ChurchMemberDataProtection");

            migrationBuilder.DropTable(
                name: "ChurchMemberRegisterNumbers");

            migrationBuilder.DropTable(
                name: "ChurchMemberRoles");

            migrationBuilder.DropTable(
                name: "ChurchMemberTrainingCertificates");

            migrationBuilder.DropTable(
                name: "EventAttendances");

            migrationBuilder.DropTable(
                name: "HSBCBankCreditTransactions");

            migrationBuilder.DropTable(
                name: "RefreshTokens");

            migrationBuilder.DropTable(
                name: "AspNetRoles");

            migrationBuilder.DropTable(
                name: "AspNetUsers");

            migrationBuilder.DropTable(
                name: "ContributionTypes");

            migrationBuilder.DropTable(
                name: "ChurchMemberRoleTypes");

            migrationBuilder.DropTable(
                name: "ChurchMembers");

            migrationBuilder.DropTable(
                name: "TrainingCertificateTypes");

            migrationBuilder.DropTable(
                name: "Events");

            migrationBuilder.DropTable(
                name: "Addresses");

            migrationBuilder.DropTable(
                name: "ChurchMemberStatuses");

            migrationBuilder.DropTable(
                name: "ChurchMemberTypes");

            migrationBuilder.DropTable(
                name: "Districts");
        }
    }
}
