using Microsoft.AspNetCore.Identity;
using ChurchRegister.Database.Enums;
using ChurchRegister.Database.Interfaces;
using System.ComponentModel.DataAnnotations;

namespace ChurchRegister.Database.Data
{
    public class ChurchRegisterWebUser : IdentityUser, IAuditableEntity
    {
        /// <summary>
        /// User's first name
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string FirstName { get; set; } = string.Empty;

        /// <summary>
        /// User's last name
        /// </summary>
        [Required]
        [MaxLength(100)]
        public string LastName { get; set; } = string.Empty;

        /// <summary>
        /// User's job title (optional)
        /// </summary>
        [MaxLength(200)]
        public string? JobTitle { get; set; }

        /// <summary>
        /// Date when the user joined the system
        /// </summary>
        public DateTime DateJoined { get; set; }

        /// <summary>
        /// Current status of the user account
        /// </summary>
        public UserAccountStatus AccountStatus { get; set; } = UserAccountStatus.Pending;

        // IAuditableEntity implementation
        public DateTime CreatedDateTime { get; set; }
        public DateTime? ModifiedDateTime { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? ModifiedBy { get; set; }

        /// <summary>
        /// Full display name for the user
        /// </summary>
        public string FullName => $"{FirstName} {LastName}";
    }
}