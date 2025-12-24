-- Create ChurchMemberStatus table
CREATE TABLE ChurchMemberStatus (
    Id INT PRIMARY KEY,
    Name VARCHAR(50)
);

-- Create Address table
CREATE TABLE Address (
    Id INT PRIMARY KEY,
    NameNumber VARCHAR(50),
    AddressLineOne VARCHAR(100),
    AddressLineTwo VARCHAR(100),
    Town VARCHAR(50),
    County VARCHAR(50),
    Postcode VARCHAR(20)
);

-- Create Districts table
CREATE TABLE Districts (
    Id INT PRIMARY KEY,
    Name VARCHAR(10)
);

-- Create ChurchMemberType table (assumed missing)
CREATE TABLE ChurchMemberType (
    Id INT PRIMARY KEY,
    Type VARCHAR(50)
);

-- Create ChurchMember table
CREATE TABLE ChurchMember (
    Id INT PRIMARY KEY,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    PhoneNumber VARCHAR(20),
    EmailAddress VARCHAR(100),
    ChurchMemberTypeId INT,
    AddressId INT,
    MemberSince DATE,
    ChurchMemberStatusId INT,
    DistrictId INT,
    Baptised BOOLEAN,
    GiftAid BOOLEAN,
    FOREIGN KEY (ChurchMemberTypeId) REFERENCES ChurchMemberType(Id),
    FOREIGN KEY (AddressId) REFERENCES Address(Id),
    FOREIGN KEY (ChurchMemberStatusId) REFERENCES ChurchMemberStatus(Id),
    FOREIGN KEY (DistrictId) REFERENCES Districts(Id)
);

-- Create ChurchMemberBankDetails table
CREATE TABLE ChurchMemberBankDetails (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    SortCode VARCHAR(10),
    AccountNumber VARCHAR(20),
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id)
);

-- Create ChurchMemberRegisterNumber table
CREATE TABLE ChurchMemberRegisterNumber (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    Number VARCHAR(20),
    Year INT,
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id)
);

-- Create ContributionType table
CREATE TABLE ContributionType (
    Id INT PRIMARY KEY,
    Type VARCHAR(50)
);

-- Create ChurchMemberContributions table
CREATE TABLE ChurchMemberContributions (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    Amount DECIMAL(10,2),
    Date DATE,
    TranscationRef VARCHAR(50),
    ContributionTypeId INT,
    Deleted BOOLEAN,
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id),
    FOREIGN KEY (ContributionTypeId) REFERENCES ContributionType(Id)
);

-- Create ChurchMemberRoleTypes table
CREATE TABLE ChurchMemberRoleTypes (
    Id INT PRIMARY KEY,
    Type VARCHAR(50)
);

-- Create ChurchMemberRoles table
CREATE TABLE ChurchMemberRoles (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    ChurchMemberRoleTypeId INT,
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id),
    FOREIGN KEY (ChurchMemberRoleTypeId) REFERENCES ChurchMemberRoleTypes(Id)
);

-- Create ChurchMemberDataProtection table
CREATE TABLE ChurchMemberDataProtection (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    AllowPhotographs BOOLEAN,
    AllowNewsletter BOOLEAN,
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id)
);

-- Create TrainingCertificateTypes table
CREATE TABLE TrainingCertificateTypes (
    Id INT PRIMARY KEY,
    Type VARCHAR(50)
);

-- Create ChurchMemberTrainingCertificates table
CREATE TABLE ChurchMemberTrainingCertificates (
    Id INT PRIMARY KEY,
    ChurchMemberId INT,
    Expires DATE,
    TrainingCertificateTypeId INT,
    FOREIGN KEY (ChurchMemberId) REFERENCES ChurchMember(Id),
    FOREIGN KEY (TrainingCertificateTypeId) REFERENCES TrainingCertificateTypes(Id)
);

-- Create Events table
CREATE TABLE Events (
    Id INT PRIMARY KEY,
    Name VARCHAR(100)
);

-- Create EventAttendance table
CREATE TABLE EventAttendance (
    Id INT PRIMARY KEY,
    EventTypeId INT,
    Date DATE,
    Attendance INT,
    FOREIGN KEY (EventTypeId) REFERENCES Events(Id)
);