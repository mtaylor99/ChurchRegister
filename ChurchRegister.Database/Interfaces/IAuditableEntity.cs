namespace ChurchRegister.Database.Interfaces;

public interface IAuditableEntity
{
    string CreatedBy { get; set; }

    DateTime CreatedDateTime { get; set; }

    string? ModifiedBy { get; set; }

    DateTime? ModifiedDateTime { get; set; }
}