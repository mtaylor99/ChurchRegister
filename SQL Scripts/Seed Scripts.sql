-- Seed data for ChurchMemberStatus
INSERT INTO ChurchMemberStatus (Id, Name) VALUES
(1, 'Active'),
(2, 'Expired'),
(3, 'In Glory'),
(4, 'InActive');

-- Seed data for ContributionType
INSERT INTO ContributionType (Id, Type) VALUES
(1, 'Cash'),
(2, 'Transfer');

-- Seed data for ChurchMemberRoleTypes
INSERT INTO ChurchMemberRoleTypes (Id, Type) VALUES
(1, 'Non-Member'),
(2, 'Member'),
(3, 'Deacon'),
(4, 'Auditor'),
(5, 'Secretary'),
(6, 'Treasurer'),
(7, 'Minister'),
(8, 'Junior Church Leader');

-- Seed data for Districts
INSERT INTO Districts (Id, Name) VALUES
(1, 'A'),
(2, 'B'),
(3, 'C'),
(4, 'D'),
(5, 'E'),
(6, 'F'),
(7, 'G');

-- Seed data for TrainingCertificateTypes
INSERT INTO TrainingCertificateTypes (Id, Type) VALUES
(1, 'DBS'),
(2, 'Safeguarding Level 2'),
(3, 'Safeguarding Level 3'),
(4, 'Food Hygiene'),
(5, 'First Aid'),
(6, 'Fire Marshal');

-- Seed data for Events
INSERT INTO Events (Id, Name) VALUES
(1, 'Sunday Morning Service'),
(2, 'Sunday Evening Service'),
(3, 'Sunday Morning Online'),
(4, 'Bible Study'),
(5, 'Tuesday Morning Service'),
(6, 'Junior Church'),
(7, 'Soup Station'),
(8, 'Youth Meeting'),
(9, 'Choir'),
(10, 'Men''s Fellowship'),
(11, 'Just A Thought'),
(12, 'Sunday Evening Call'),
(13, 'Open Door'),
(14, 'Torch'),
(15, 'Coffee Corner');
