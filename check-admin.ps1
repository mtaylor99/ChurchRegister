# Quick script to check admin user status
$connectionString = "Server=(localdb)\mssqllocaldb;Database=ChurchRegisterWeb;Trusted_Connection=True;MultipleActiveResultSets=true"

# Load SQL Server assembly
Add-Type -AssemblyName "System.Data"

$connection = New-Object System.Data.SqlClient.SqlConnection
$connection.ConnectionString = $connectionString

try {
    $connection.Open()
    
    $command = $connection.CreateCommand()
    $command.CommandText = "SELECT Email, RequirePasswordChange, EmailConfirmed FROM AspNetUsers WHERE Email = 'admin@churchregister.com'"
    
    $reader = $command.ExecuteReader()
    
    if ($reader.Read()) {
        Write-Host "Email: $($reader['Email'])"
        Write-Host "RequirePasswordChange: $($reader['RequirePasswordChange'])"
        Write-Host "EmailConfirmed: $($reader['EmailConfirmed'])"
    } else {
        Write-Host "Admin user not found!"
    }
    
    $reader.Close()
    
    # Check roles
    $command.CommandText = @"
SELECT r.Name 
FROM AspNetRoles r 
INNER JOIN AspNetUserRoles ur ON r.Id = ur.RoleId 
INNER JOIN AspNetUsers u ON u.Id = ur.UserId 
WHERE u.Email = 'admin@churchregister.com'
"@
    
    $reader = $command.ExecuteReader()
    Write-Host "`nRoles:"
    while ($reader.Read()) {
        Write-Host "  - $($reader['Name'])"
    }
    $reader.Close()
    
    # Check claims
    $command.CommandText = @"
SELECT ClaimType, ClaimValue 
FROM AspNetUserClaims 
WHERE UserId = (SELECT Id FROM AspNetUsers WHERE Email = 'admin@churchregister.com')
"@
    
    $reader = $command.ExecuteReader()
    Write-Host "`nClaims:"
    while ($reader.Read()) {
        Write-Host "  - $($reader['ClaimType']): $($reader['ClaimValue'])"
    }
    $reader.Close()
    
} catch {
    Write-Host "Error: $_"
} finally {
    $connection.Close()
}
