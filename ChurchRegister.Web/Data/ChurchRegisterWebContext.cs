using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace ChurchRegister.Web.Data
{
    public class ChurchRegisterWebContext(DbContextOptions<ChurchRegisterWebContext> options) : IdentityDbContext<ChurchRegisterWebUser>(options)
    {
    }
}
