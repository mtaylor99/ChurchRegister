namespace ChurchRegister.ApiService.Models.ChurchMembers;

/// <summary>
/// Response model for church member creation
/// </summary>
public class CreateChurchMemberResponse
{
    /// <summary>
    /// ID of the newly created member
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Success message
    /// </summary>
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Detailed member information
    /// </summary>
    public ChurchMemberDetailDto? Member { get; set; }
}

/// <summary>
/// Request for generating register numbers for next year
/// </summary>
public class GenerateRegisterNumbersRequest
{
    /// <summary>
    /// Target year for register number generation (e.g., 2026)
    /// </summary>
    public int TargetYear { get; set; }

    /// <summary>
    /// Confirmation flag - must be true to proceed with generation
    /// </summary>
    public bool ConfirmGeneration { get; set; }
}

/// <summary>
/// Response for register number generation
/// </summary>
public class GenerateRegisterNumbersResponse
{
    /// <summary>
    /// Year for which numbers were generated
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Total number of baptised Members assigned register numbers (range 1 to NonBaptisedMemberStartNumber-1)
    /// </summary>
    public int TotalMembersAssigned { get; set; }

    /// <summary>
    /// Total number of unbaptised Members assigned register numbers (range NonBaptisedMemberStartNumber to NonMemberStartNumber-1)
    /// </summary>
    public int TotalNonBaptisedMembersAssigned { get; set; }

    /// <summary>
    /// Total number of Non-Members (role = Non-Member) assigned register numbers (range NonMemberStartNumber+)
    /// </summary>
    public int TotalNonMembersAssigned { get; set; }

    /// <summary>
    /// DateTime when generation was completed
    /// </summary>
    public DateTime GeneratedDateTime { get; set; }

    /// <summary>
    /// User who generated the numbers
    /// </summary>
    public string GeneratedBy { get; set; } = string.Empty;
}

/// <summary>
/// Assignment of register number to a member
/// </summary>
public class RegisterNumberAssignment
{
    /// <summary>
    /// Assigned register number for the target year
    /// </summary>
    public int RegisterNumber { get; set; }

    /// <summary>
    /// Church member ID
    /// </summary>
    public int MemberId { get; set; }

    /// <summary>
    /// Member's full name
    /// </summary>
    public string MemberName { get; set; } = string.Empty;

    /// <summary>
    /// Date the member joined
    /// </summary>
    public DateTime MemberSince { get; set; }

    /// <summary>
    /// Member's current year register number (if exists)
    /// </summary>
    public int? CurrentNumber { get; set; }

    /// <summary>
    /// Membership role type: "Member" or "Non-Member"
    /// </summary>
    public string MemberType { get; set; } = string.Empty;
}

/// <summary>
/// Response for previewing register number assignments, split by membership role.
/// </summary>
public class PreviewRegisterNumbersResponse
{
    /// <summary>
    /// Target year for preview
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Total number of baptised Members who would receive numbers (1 to NonBaptisedMemberStartNumber-1)
    /// </summary>
    public int TotalMembers { get; set; }

    /// <summary>
    /// Total number of unbaptised Members who would receive numbers (NonBaptisedMemberStartNumber to NonMemberStartNumber-1)
    /// </summary>
    public int TotalNonBaptisedMembers { get; set; }

    /// <summary>
    /// Total number of Non-Members who would receive numbers (NonMemberStartNumber+)
    /// </summary>
    public int TotalNonMembers { get; set; }

    /// <summary>
    /// DateTime when preview was generated
    /// </summary>
    public DateTime PreviewGenerated { get; set; }

    /// <summary>
    /// Register number assignments for baptised Members (numbers 1 to NonBaptisedMemberStartNumber-1)
    /// </summary>
    public List<RegisterNumberAssignment> Members { get; set; } = new();

    /// <summary>
    /// Register number assignments for unbaptised Members (numbers NonBaptisedMemberStartNumber to NonMemberStartNumber-1)
    /// </summary>
    public List<RegisterNumberAssignment> NonBaptisedMembers { get; set; } = new();

    /// <summary>
    /// Register number assignments for Non-Members (numbers NonMemberStartNumber+)
    /// </summary>
    public List<RegisterNumberAssignment> NonMembers { get; set; } = new();
}
