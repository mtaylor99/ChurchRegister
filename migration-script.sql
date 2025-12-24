IF OBJECT_ID(N'[__EFMigrationsHistory]') IS NULL
BEGIN
    CREATE TABLE [__EFMigrationsHistory] (
        [MigrationId] nvarchar(150) NOT NULL,
        [ProductVersion] nvarchar(32) NOT NULL,
        CONSTRAINT [PK___EFMigrationsHistory] PRIMARY KEY ([MigrationId])
    );
END;
GO

BEGIN TRANSACTION;
IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [Addresses] (
        [Id] int NOT NULL IDENTITY,
        [NameNumber] nvarchar(50) NULL,
        [AddressLineOne] nvarchar(100) NULL,
        [AddressLineTwo] nvarchar(100) NULL,
        [Town] nvarchar(50) NULL,
        [County] nvarchar(50) NULL,
        [Postcode] nvarchar(20) NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_Addresses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetRoles] (
        [Id] nvarchar(450) NOT NULL,
        [Name] nvarchar(256) NULL,
        [NormalizedName] nvarchar(256) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoles] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetUsers] (
        [Id] nvarchar(450) NOT NULL,
        [FirstName] nvarchar(100) NOT NULL,
        [LastName] nvarchar(100) NOT NULL,
        [JobTitle] nvarchar(200) NULL,
        [DateJoined] datetime2 NOT NULL,
        [AccountStatus] int NOT NULL,
        [Avatar] nvarchar(10) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedDateTime] datetime2 NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [UserName] nvarchar(256) NULL,
        [NormalizedUserName] nvarchar(256) NULL,
        [Email] nvarchar(256) NULL,
        [NormalizedEmail] nvarchar(256) NULL,
        [EmailConfirmed] bit NOT NULL,
        [PasswordHash] nvarchar(max) NULL,
        [SecurityStamp] nvarchar(max) NULL,
        [ConcurrencyStamp] nvarchar(max) NULL,
        [PhoneNumber] nvarchar(max) NULL,
        [PhoneNumberConfirmed] bit NOT NULL,
        [TwoFactorEnabled] bit NOT NULL,
        [LockoutEnd] datetimeoffset NULL,
        [LockoutEnabled] bit NOT NULL,
        [AccessFailedCount] int NOT NULL,
        CONSTRAINT [PK_AspNetUsers] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberRoleTypes] (
        [Id] int NOT NULL IDENTITY,
        [Type] nvarchar(50) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberRoleTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberStatuses] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(50) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberStatuses] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberTypes] (
        [Id] int NOT NULL IDENTITY,
        [Type] nvarchar(50) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ContributionTypes] (
        [Id] int NOT NULL IDENTITY,
        [Type] nvarchar(50) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ContributionTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [Districts] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(10) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_Districts] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [Events] (
        [Id] int NOT NULL IDENTITY,
        [Name] nvarchar(100) NOT NULL,
        [Description] nvarchar(500) NULL,
        [IsActive] bit NOT NULL DEFAULT CAST(1 AS bit),
        [ShowInAnalysis] bit NOT NULL DEFAULT CAST(1 AS bit),
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_Events] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [HSBCBankCreditTransactions] (
        [Id] int NOT NULL IDENTITY,
        [Date] datetime2 NOT NULL,
        [Description] nvarchar(500) NULL,
        [Reference] nvarchar(100) NULL,
        [MoneyIn] decimal(10,2) NOT NULL,
        [Deleted] bit NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_HSBCBankCreditTransactions] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [RefreshTokens] (
        [Id] int NOT NULL IDENTITY,
        [Token] nvarchar(256) NOT NULL,
        [UserId] nvarchar(450) NOT NULL,
        [ExpiryDate] datetime2 NOT NULL,
        [IsRevoked] bit NOT NULL,
        [RevokedDate] datetime2 NULL,
        [CreatedByIp] nvarchar(45) NULL,
        [RevokedByIp] nvarchar(45) NULL,
        [ReplacedByToken] nvarchar(256) NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedDateTime] datetime2 NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        CONSTRAINT [PK_RefreshTokens] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [TrainingCertificateTypes] (
        [Id] int NOT NULL IDENTITY,
        [Type] nvarchar(50) NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_TrainingCertificateTypes] PRIMARY KEY ([Id])
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetRoleClaims] (
        [Id] int NOT NULL IDENTITY,
        [RoleId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetRoleClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetRoleClaims_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetUserClaims] (
        [Id] int NOT NULL IDENTITY,
        [UserId] nvarchar(450) NOT NULL,
        [ClaimType] nvarchar(max) NULL,
        [ClaimValue] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserClaims] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_AspNetUserClaims_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetUserLogins] (
        [LoginProvider] nvarchar(450) NOT NULL,
        [ProviderKey] nvarchar(450) NOT NULL,
        [ProviderDisplayName] nvarchar(max) NULL,
        [UserId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserLogins] PRIMARY KEY ([LoginProvider], [ProviderKey]),
        CONSTRAINT [FK_AspNetUserLogins_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetUserRoles] (
        [UserId] nvarchar(450) NOT NULL,
        [RoleId] nvarchar(450) NOT NULL,
        CONSTRAINT [PK_AspNetUserRoles] PRIMARY KEY ([UserId], [RoleId]),
        CONSTRAINT [FK_AspNetUserRoles_AspNetRoles_RoleId] FOREIGN KEY ([RoleId]) REFERENCES [AspNetRoles] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_AspNetUserRoles_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [AspNetUserTokens] (
        [UserId] nvarchar(450) NOT NULL,
        [LoginProvider] nvarchar(450) NOT NULL,
        [Name] nvarchar(450) NOT NULL,
        [Value] nvarchar(max) NULL,
        CONSTRAINT [PK_AspNetUserTokens] PRIMARY KEY ([UserId], [LoginProvider], [Name]),
        CONSTRAINT [FK_AspNetUserTokens_AspNetUsers_UserId] FOREIGN KEY ([UserId]) REFERENCES [AspNetUsers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMembers] (
        [Id] int NOT NULL IDENTITY,
        [FirstName] nvarchar(50) NOT NULL,
        [LastName] nvarchar(50) NOT NULL,
        [PhoneNumber] nvarchar(20) NULL,
        [EmailAddress] nvarchar(100) NULL,
        [BankReference] nvarchar(100) NULL,
        [ChurchMemberTypeId] int NULL,
        [AddressId] int NULL,
        [ChurchMemberStatusId] int NULL,
        [DistrictId] int NULL,
        [MemberSince] datetime2 NULL,
        [Baptised] bit NOT NULL,
        [GiftAid] bit NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMembers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMembers_Addresses_AddressId] FOREIGN KEY ([AddressId]) REFERENCES [Addresses] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_ChurchMembers_ChurchMemberStatuses_ChurchMemberStatusId] FOREIGN KEY ([ChurchMemberStatusId]) REFERENCES [ChurchMemberStatuses] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_ChurchMembers_ChurchMemberTypes_ChurchMemberTypeId] FOREIGN KEY ([ChurchMemberTypeId]) REFERENCES [ChurchMemberTypes] ([Id]) ON DELETE SET NULL,
        CONSTRAINT [FK_ChurchMembers_Districts_DistrictId] FOREIGN KEY ([DistrictId]) REFERENCES [Districts] ([Id]) ON DELETE SET NULL
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [EventAttendances] (
        [Id] int NOT NULL IDENTITY,
        [EventId] int NOT NULL,
        [Date] datetime2 NOT NULL,
        [Attendance] int NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_EventAttendances] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_EventAttendances_Events_EventId] FOREIGN KEY ([EventId]) REFERENCES [Events] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberContributions] (
        [Id] int NOT NULL IDENTITY,
        [ChurchMemberId] int NOT NULL,
        [Amount] decimal(10,2) NOT NULL,
        [Date] datetime2 NOT NULL,
        [TranscationRef] nvarchar(50) NULL,
        [ContributionTypeId] int NOT NULL,
        [Deleted] bit NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberContributions] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMemberContributions_ChurchMembers_ChurchMemberId] FOREIGN KEY ([ChurchMemberId]) REFERENCES [ChurchMembers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChurchMemberContributions_ContributionTypes_ContributionTypeId] FOREIGN KEY ([ContributionTypeId]) REFERENCES [ContributionTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberDataProtection] (
        [Id] int NOT NULL IDENTITY,
        [ChurchMemberId] int NOT NULL,
        [AllowPhotographs] bit NOT NULL,
        [AllowNewsletter] bit NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberDataProtection] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMemberDataProtection_ChurchMembers_ChurchMemberId] FOREIGN KEY ([ChurchMemberId]) REFERENCES [ChurchMembers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberRegisterNumbers] (
        [Id] int NOT NULL IDENTITY,
        [ChurchMemberId] int NOT NULL,
        [Number] nvarchar(20) NULL,
        [Year] int NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberRegisterNumbers] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMemberRegisterNumbers_ChurchMembers_ChurchMemberId] FOREIGN KEY ([ChurchMemberId]) REFERENCES [ChurchMembers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberRoles] (
        [Id] int NOT NULL IDENTITY,
        [ChurchMemberId] int NOT NULL,
        [ChurchMemberRoleTypeId] int NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberRoles] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMemberRoles_ChurchMemberRoleTypes_ChurchMemberRoleTypeId] FOREIGN KEY ([ChurchMemberRoleTypeId]) REFERENCES [ChurchMemberRoleTypes] ([Id]) ON DELETE NO ACTION,
        CONSTRAINT [FK_ChurchMemberRoles_ChurchMembers_ChurchMemberId] FOREIGN KEY ([ChurchMemberId]) REFERENCES [ChurchMembers] ([Id]) ON DELETE CASCADE
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE TABLE [ChurchMemberTrainingCertificates] (
        [Id] int NOT NULL IDENTITY,
        [ChurchMemberId] int NOT NULL,
        [Expires] datetime2 NULL,
        [TrainingCertificateTypeId] int NOT NULL,
        [CreatedBy] nvarchar(max) NOT NULL,
        [CreatedDateTime] datetime2 NOT NULL,
        [ModifiedBy] nvarchar(max) NULL,
        [ModifiedDateTime] datetime2 NULL,
        CONSTRAINT [PK_ChurchMemberTrainingCertificates] PRIMARY KEY ([Id]),
        CONSTRAINT [FK_ChurchMemberTrainingCertificates_ChurchMembers_ChurchMemberId] FOREIGN KEY ([ChurchMemberId]) REFERENCES [ChurchMembers] ([Id]) ON DELETE CASCADE,
        CONSTRAINT [FK_ChurchMemberTrainingCertificates_TrainingCertificateTypes_TrainingCertificateTypeId] FOREIGN KEY ([TrainingCertificateTypeId]) REFERENCES [TrainingCertificateTypes] ([Id]) ON DELETE NO ACTION
    );
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[ChurchMemberRoleTypes]'))
        SET IDENTITY_INSERT [ChurchMemberRoleTypes] ON;
    EXEC(N'INSERT INTO [ChurchMemberRoleTypes] ([Id], [CreatedBy], [CreatedDateTime], [ModifiedBy], [ModifiedDateTime], [Type])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Non-Member''),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Member''),
    (3, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Deacon''),
    (4, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Auditor''),
    (5, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Secretary''),
    (6, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Treasurer''),
    (7, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Minister''),
    (8, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Junior Church Leader'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[ChurchMemberRoleTypes]'))
        SET IDENTITY_INSERT [ChurchMemberRoleTypes] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[ChurchMemberStatuses]'))
        SET IDENTITY_INSERT [ChurchMemberStatuses] ON;
    EXEC(N'INSERT INTO [ChurchMemberStatuses] ([Id], [CreatedBy], [CreatedDateTime], [ModifiedBy], [ModifiedDateTime], [Name])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Active''),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Expired''),
    (3, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''In Glory''),
    (4, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''InActive'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[ChurchMemberStatuses]'))
        SET IDENTITY_INSERT [ChurchMemberStatuses] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[ContributionTypes]'))
        SET IDENTITY_INSERT [ContributionTypes] ON;
    EXEC(N'INSERT INTO [ContributionTypes] ([Id], [CreatedBy], [CreatedDateTime], [ModifiedBy], [ModifiedDateTime], [Type])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Cash''),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Transfer'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[ContributionTypes]'))
        SET IDENTITY_INSERT [ContributionTypes] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Districts]'))
        SET IDENTITY_INSERT [Districts] ON;
    EXEC(N'INSERT INTO [Districts] ([Id], [CreatedBy], [CreatedDateTime], [ModifiedBy], [ModifiedDateTime], [Name])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''A''),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''B''),
    (3, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''C''),
    (4, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''D''),
    (5, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''E''),
    (6, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''F''),
    (7, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''G'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Districts]'))
        SET IDENTITY_INSERT [Districts] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name], [ShowInAnalysis])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Weekly Sunday morning worship service'', CAST(1 AS bit), NULL, NULL, N''Sunday Morning Service'', CAST(1 AS bit)),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Weekly Sunday evening worship service'', CAST(1 AS bit), NULL, NULL, N''Sunday Evening Service'', CAST(1 AS bit)),
    (3, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Online streaming of Sunday morning service'', CAST(1 AS bit), NULL, NULL, N''Sunday Morning Online'', CAST(1 AS bit)),
    (4, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Midweek Bible study and prayer meeting'', CAST(1 AS bit), NULL, NULL, N''Bible Study'', CAST(1 AS bit)),
    (5, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Tuesday morning prayer and worship'', CAST(1 AS bit), NULL, NULL, N''Tuesday Morning Service'', CAST(1 AS bit)),
    (6, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Children''''s service during main worship'', CAST(1 AS bit), NULL, NULL, N''Junior Church'', CAST(1 AS bit))');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name])
    VALUES (7, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Community outreach and meal service'', CAST(1 AS bit), NULL, NULL, N''Soup Station'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name], [ShowInAnalysis])
    VALUES (8, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Weekly youth fellowship and activities'', CAST(1 AS bit), NULL, NULL, N''Youth Meeting'', CAST(1 AS bit))');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name])
    VALUES (9, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Choir rehearsal and practice'', CAST(1 AS bit), NULL, NULL, N''Choir'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name], [ShowInAnalysis])
    VALUES (10, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Monthly men''''s fellowship meeting'', CAST(1 AS bit), NULL, NULL, N''Men''''s Fellowship'', CAST(1 AS bit)),
    (11, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Midweek inspirational service'', CAST(1 AS bit), NULL, NULL, N''Just A Thought'', CAST(1 AS bit))');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name])
    VALUES (12, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Evening prayer call service'', CAST(1 AS bit), NULL, NULL, N''Sunday Evening Call''),
    (13, N''system'', ''2025-01-01T00:00:00.0000000Z'', N''Open door community service'', CAST(1 AS bit), NULL, NULL, N''Open Door'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] ON;
    EXEC(N'INSERT INTO [Events] ([Id], [CreatedBy], [CreatedDateTime], [Description], [IsActive], [ModifiedBy], [ModifiedDateTime], [Name], [ShowInAnalysis])
    VALUES (14, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, CAST(1 AS bit), NULL, NULL, N''Torch'', CAST(1 AS bit)),
    (15, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, CAST(1 AS bit), NULL, NULL, N''Coffee Corner'', CAST(1 AS bit))');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'Description', N'IsActive', N'ModifiedBy', N'ModifiedDateTime', N'Name', N'ShowInAnalysis') AND [object_id] = OBJECT_ID(N'[Events]'))
        SET IDENTITY_INSERT [Events] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[TrainingCertificateTypes]'))
        SET IDENTITY_INSERT [TrainingCertificateTypes] ON;
    EXEC(N'INSERT INTO [TrainingCertificateTypes] ([Id], [CreatedBy], [CreatedDateTime], [ModifiedBy], [ModifiedDateTime], [Type])
    VALUES (1, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''DBS''),
    (2, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Safeguarding Level 2''),
    (3, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Safeguarding Level 3''),
    (4, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Food Hygiene''),
    (5, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''First Aid''),
    (6, N''system'', ''2025-01-01T00:00:00.0000000Z'', NULL, NULL, N''Fire Marshal'')');
    IF EXISTS (SELECT * FROM [sys].[identity_columns] WHERE [name] IN (N'Id', N'CreatedBy', N'CreatedDateTime', N'ModifiedBy', N'ModifiedDateTime', N'Type') AND [object_id] = OBJECT_ID(N'[TrainingCertificateTypes]'))
        SET IDENTITY_INSERT [TrainingCertificateTypes] OFF;
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_AspNetRoleClaims_RoleId] ON [AspNetRoleClaims] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [RoleNameIndex] ON [AspNetRoles] ([NormalizedName]) WHERE [NormalizedName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_AspNetUserClaims_UserId] ON [AspNetUserClaims] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_AspNetUserLogins_UserId] ON [AspNetUserLogins] ([UserId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_AspNetUserRoles_RoleId] ON [AspNetUserRoles] ([RoleId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [EmailIndex] ON [AspNetUsers] ([NormalizedEmail]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    EXEC(N'CREATE UNIQUE INDEX [UserNameIndex] ON [AspNetUsers] ([NormalizedUserName]) WHERE [NormalizedUserName] IS NOT NULL');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberContributions_ChurchMemberId] ON [ChurchMemberContributions] ([ChurchMemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberContributions_ContributionTypeId] ON [ChurchMemberContributions] ([ContributionTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberDataProtection_ChurchMemberId] ON [ChurchMemberDataProtection] ([ChurchMemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberRegisterNumbers_ChurchMemberId] ON [ChurchMemberRegisterNumbers] ([ChurchMemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberRoles_ChurchMemberId] ON [ChurchMemberRoles] ([ChurchMemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberRoles_ChurchMemberRoleTypeId] ON [ChurchMemberRoles] ([ChurchMemberRoleTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMembers_AddressId] ON [ChurchMembers] ([AddressId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMembers_ChurchMemberStatusId] ON [ChurchMembers] ([ChurchMemberStatusId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMembers_ChurchMemberTypeId] ON [ChurchMembers] ([ChurchMemberTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMembers_DistrictId] ON [ChurchMembers] ([DistrictId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberTrainingCertificates_ChurchMemberId] ON [ChurchMemberTrainingCertificates] ([ChurchMemberId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE INDEX [IX_ChurchMemberTrainingCertificates_TrainingCertificateTypeId] ON [ChurchMemberTrainingCertificates] ([TrainingCertificateTypeId]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    CREATE UNIQUE INDEX [IX_EventAttendance_EventId_Date] ON [EventAttendances] ([EventId], [Date]);
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222151010_InitialApplication'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251222151010_InitialApplication', N'9.0.10');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222160711_AddHsbcTransactionDuplicateIndex'
)
BEGIN
    EXEC(N'CREATE INDEX [IX_HSBCBankCreditTransaction_DuplicateCheck] ON [HSBCBankCreditTransactions] ([Date], [MoneyIn], [Description]) WHERE [Deleted] = 0');
END;

IF NOT EXISTS (
    SELECT * FROM [__EFMigrationsHistory]
    WHERE [MigrationId] = N'20251222160711_AddHsbcTransactionDuplicateIndex'
)
BEGIN
    INSERT INTO [__EFMigrationsHistory] ([MigrationId], [ProductVersion])
    VALUES (N'20251222160711_AddHsbcTransactionDuplicateIndex', N'9.0.10');
END;

COMMIT;
GO

