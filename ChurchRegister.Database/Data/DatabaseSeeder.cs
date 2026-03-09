using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using ChurchRegister.Database.Constants;
using ChurchRegister.Database.Enums;

namespace ChurchRegister.Database.Data
{
    public static class DatabaseSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<ChurchRegisterWebContext>();
            var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ChurchRegisterWebUser>>();
            var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<IdentityRole>>();
            var loggerFactory = scope.ServiceProvider.GetRequiredService<ILoggerFactory>();
            var logger = loggerFactory.CreateLogger("ChurchRegister.Database.Data.DatabaseSeeder");

            try
            {
                // Apply any pending migrations - this replaces EnsureCreatedAsync
                logger.LogInformation("Applying database migrations...");
                await context.Database.MigrateAsync();
                logger.LogInformation("Database migrations applied successfully.");
                
                // Seed system roles
                await SeedSystemRoles(roleManager, logger);
                
                // Seed admin user
                await SeedAdminUser(userManager, logger);
                
                // Additional seed data is handled via Entity Framework seed data in OnModelCreating
                logger.LogInformation("Database seeding completed successfully.");
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred while seeding the database");
                throw;
            }
        }

        private static async Task SeedSystemRoles(RoleManager<IdentityRole> roleManager, ILogger logger)
        {
            logger.LogInformation("Seeding system roles...");
            
            foreach (var roleName in SystemRoles.AllRoles)
            {
                var roleExists = await roleManager.RoleExistsAsync(roleName);
                if (!roleExists)
                {
                    var role = new IdentityRole(roleName);
                    var result = await roleManager.CreateAsync(role);
                    
                    if (result.Succeeded)
                    {
                        logger.LogInformation("Created role: {RoleName}", roleName);
                    }
                    else
                    {
                        logger.LogError("Failed to create role {RoleName}: {Errors}", 
                            roleName, string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    logger.LogDebug("Role already exists: {RoleName}", roleName);
                }
            }
            
            logger.LogInformation("System roles seeding completed.");
        }

        private static async Task SeedAdminUser(UserManager<ChurchRegisterWebUser> userManager, ILogger logger)
        {
            logger.LogInformation("Seeding admin user...");
            
            var adminUser = await userManager.FindByEmailAsync("admin@churchregister.com");
            if (adminUser == null)
            {
                adminUser = new ChurchRegisterWebUser
                {
                    UserName = "churchregister.com",
                    Email = "admin@churchregister.com",
                    EmailConfirmed = true,
                    FirstName = "System",
                    LastName = "Administrator",
                    JobTitle = "System Administrator",
                    DateJoined = new DateTime(2024, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                    AccountStatus = UserAccountStatus.Active,
                    CreatedDateTime = new DateTime(2024, 11, 1, 0, 0, 0, DateTimeKind.Utc),
                    CreatedBy = "System"
                };

                var result = await userManager.CreateAsync(adminUser, "AdminPassword123!");
                
                if (result.Succeeded)
                {
                    // Assign SystemAdministration role
                    var roleResult = await userManager.AddToRoleAsync(adminUser, SystemRoles.SystemAdministration);
                    
                    if (roleResult.Succeeded)
                    {
                        // Add permission claims to newly created admin user
                        await AddPermissionClaimsToAdminUser(userManager, adminUser, logger);
                        logger.LogInformation("Admin user created successfully with SystemAdministration role: {Email}", adminUser.Email);
                    }
                    else
                    {
                        logger.LogError("Failed to assign SystemAdministration role to admin user: {Errors}", 
                            string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    logger.LogError("Failed to create admin user: {Errors}", 
                        string.Join(", ", result.Errors.Select(e => e.Description)));
                }
            }
            else
            {
                logger.LogInformation("Admin user already exists: {Email}", adminUser.Email);
                
                // Ensure admin user has SystemAdministration role
                var hasRole = await userManager.IsInRoleAsync(adminUser, SystemRoles.SystemAdministration);
                if (!hasRole)
                {
                    var roleResult = await userManager.AddToRoleAsync(adminUser, SystemRoles.SystemAdministration);
                    if (roleResult.Succeeded)
                    {
                        logger.LogInformation("Assigned SystemAdministration role to existing admin user");
                    }
                    else
                    {
                        logger.LogError("Failed to assign SystemAdministration role to existing admin user: {Errors}", 
                            string.Join(", ", roleResult.Errors.Select(e => e.Description)));
                    }
                }
                
                // Ensure existing admin user has all required permissions
                await AddPermissionClaimsToAdminUser(userManager, adminUser, logger);
            }
        }

        private static async Task AddPermissionClaimsToAdminUser(UserManager<ChurchRegisterWebUser> userManager, ChurchRegisterWebUser user, ILogger logger)
        {
            logger.LogInformation("Adding permission claims to user: {Email}", user.Email);
            
            var permissions = new[]
            {
                "EventManagement.Create",
                "EventManagement.Update", 
                "EventManagement.Delete",
                "EventManagement.View",
                "Attendance.View",
                "Attendance.Record",
                "Attendance.ViewAnalytics",
                "Attendance.ShareAnalytics",
                "Financial.View",
                "Financial.Contribute",
                "Financial.Administrate",
                "ChurchMembers.View",
                "ChurchMembers.Edit",
                "ChurchMembers.Create",
                "ChurchMembers.Delete"
            };

            foreach (var permission in permissions)
            {
                var existingClaims = await userManager.GetClaimsAsync(user);
                var hasPermission = existingClaims.Any(c => c.Type == "permission" && c.Value == permission);
                
                if (!hasPermission)
                {
                    var result = await userManager.AddClaimAsync(user, new System.Security.Claims.Claim("permission", permission));
                    if (result.Succeeded)
                    {
                        logger.LogInformation("Added permission claim: {Permission} to user: {Email}", permission, user.Email);
                    }
                    else
                    {
                        logger.LogError("Failed to add permission claim {Permission} to user {Email}: {Errors}", 
                            permission, user.Email, string.Join(", ", result.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    logger.LogDebug("User {Email} already has permission: {Permission}", user.Email, permission);
                }
            }
        }
    }
}