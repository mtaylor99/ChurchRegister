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
    /// Total number of active members assigned register numbers
    /// </summary>
    public int TotalMembersAssigned { get; set; }

    /// <summary>
    /// DateTime when generation was completed
    /// </summary>
    public DateTime GeneratedDateTime { get; set; }

    /// <summary>
    /// User who generated the numbers
    /// </summary>
    public string GeneratedBy { get; set; } = string.Empty;

    /// <summary>
    /// Preview of first 10 assignments
    /// </summary>
    public List<RegisterNumberAssignment> Preview { get; set; } = new();
}

/// <summary>
/// Assignment of register number to a member
/// </summary>
public class RegisterNumberAssignment
{
    /// <summary>
    /// Assigned register number
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
}

/// <summary>
/// Response for previewing register number assignments
/// </summary>
public class PreviewRegisterNumbersResponse
{
    /// <summary>
    /// Target year for preview
    /// </summary>
    public int Year { get; set; }

    /// <summary>
    /// Total number of active members who would receive numbers
    /// </summary>
    public int TotalActiveMembers { get; set; }

    /// <summary>
    /// DateTime when preview was generated
    /// </summary>
    public DateTime PreviewGenerated { get; set; }

    /// <summary>
    /// List of all register number assignments
    /// </summary>
    public List<RegisterNumberAssignment> Assignments { get; set; } = new();
}
