namespace ChurchRegister.ApiService.Configuration
{
    /// <summary>
    /// Configuration for member register number generation sequences.
    /// </summary>
    public class MembershipNumbersConfiguration
    {
        public const string SectionName = "MembershipNumbers";

        /// <summary>
        /// The first register number assigned to baptised Members in the annual generation sequence.
        /// Baptised Member numbers always start at 1.
        /// Unbaptised Member numbers start at this value (range: NonBaptisedMemberStartNumber to NonMemberStartNumber - 1).
        /// Must be set higher than the anticipated maximum number of baptised Members.
        /// Default: 250
        /// </summary>
        public int NonBaptisedMemberStartNumber { get; set; } = 250;

        /// <summary>
        /// The first register number assigned to Non-Members in the annual generation sequence.
        /// Non-Member numbers start at this value (range: NonMemberStartNumber and above).
        /// Must be set higher than the anticipated maximum number of baptised + unbaptised Members.
        /// Default: 500
        /// </summary>
        public int NonMemberStartNumber { get; set; } = 500;
    }
}
