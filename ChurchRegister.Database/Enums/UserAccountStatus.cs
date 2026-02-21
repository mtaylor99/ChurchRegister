namespace ChurchRegister.Database.Enums
{
    /// <summary>
    /// Represents the status of a user account in the system
    /// </summary>
    public enum UserAccountStatus
    {
        /// <summary>
        /// Account is pending email verification (legacy status)
        /// </summary>
        Pending = 1,
        
        /// <summary>
        /// Account is active and user can log in
        /// </summary>
        Active = 2,
        
        /// <summary>
        /// Account is locked by administrator - user cannot log in
        /// </summary>
        Locked = 3,
        
        /// <summary>
        /// Account is inactive - user cannot log in
        /// </summary>
        Inactive = 4,
        
        /// <summary>
        /// Account invitation has been sent but not yet accepted
        /// </summary>
        Invited = 5
    }
}