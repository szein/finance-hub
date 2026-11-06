using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

public class MinimalApi
{
    public static void Configure(WebApplication app)
    {
        app.MapGet("/api/health", () => "I am Alive!");
        
        app.MapGet("/api/dbhealth", async (FinanceDbContext db)   =>
        {
            var members = await db.Members.CountAsync();
            return Results.Ok(new { message = "Database is healthy. Members: " + members });
        });

        app.MapGet("/api/init", (FinanceDbContext db) =>
        {
            //TODO: Try use seeding instead of this endpoint which will be checked when the app starts and create default admin user if no users exist. This is just for development convenience.
            Console.WriteLine("Initializing database...");
            db.Database.EnsureCreated();
            

            Console.WriteLine("Checking for existing members...");
            if (!db.Members.Any())
            {
                Console.WriteLine("No members found. Creating default admin user...");
                var (hash, salt) = PasswordHasher.HashPassword("admin123");
                db.Members.Add(new Member
                {
                    Name = "Admin User",
                    Username = "admin",
                    Role = UserRole.Admin,
                    PasswordHash = hash,
                    PasswordSalt = salt,
                    Status = UserState.Active,
                    JoinDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
                });
                db.SaveChanges();
            }

            return Results.Ok(new { message = "Database initialized with default admin user." });
        });

#region AuthEndpoints
        app.MapPost("/api/auth/register", async (RegisterRequest request, FinanceDbContext db, TokenService tokens) =>
        {
            Console.WriteLine("Received registration request for username: " + request.Username);
            var validationError = ValidateRegistration(request);
            if (validationError is not null)
            {
                return Results.BadRequest(new { error = validationError });
            }

            var username = request.Username.Trim();
            var normalizedUsername = username.ToUpperInvariant();

            var usernameExists = await db.Members.AnyAsync(m => m.Username != null && m.Username.ToUpper() == normalizedUsername);
            if (usernameExists)
            {
                return Results.Conflict(new { error = "Username is already taken." });
            }

            var (hash, salt) = PasswordHasher.HashPassword(request.Password);
            var member = new Member
            {
                Name = request.Name.Trim(),
                Username = username,
                Role = request.Role is not null ? Enum.Parse<UserRole>(request.Role) : UserRole.Member   ,
                PasswordHash = hash,
                PasswordSalt = salt,
                Status = UserState.Active,
                JoinDate = DateTime.UtcNow.ToString("yyyy-MM-dd")
            };

            db.Members.Add(member);
            await db.SaveChangesAsync();

            return Results.Ok(tokens.CreateToken(member));
        }).AllowAnonymous();

        app.MapPost("/api/auth/login", async (LoginRequest request, FinanceDbContext db, TokenService tokens) =>
        {
            if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            {
                return Results.BadRequest(new { error = "Username and password are required." });
            }

            var username = request.Username.Trim();
            var normalizedUsername = username.ToUpperInvariant();
            var member = await db.Members.FirstOrDefaultAsync(m => m.Username != null && m.Username.ToUpper() == normalizedUsername);

            if (member is null || member.Status != UserState.Active)
            {
                Console.WriteLine($"Login failed for username: {request.Username}. User not found or inactive.");
                return Results.Unauthorized();
            }

            if (!PasswordHasher.Verify(request.Password, member.PasswordHash, member.PasswordSalt))
            {
                Console.WriteLine($"Login failed for username: {request.Username}. Incorrect password.");
                return Results.Unauthorized();
            }

            Console.WriteLine($"Login successful for username: {request.Username} Role: {member.Role} Enum: {UserRole.Admin.ToString()}.");

            return Results.Ok(tokens.CreateToken(member));
        }).AllowAnonymous();

        app.MapGet("/api/auth/me", (HttpContext ctx) =>
        {
            // Get the Sub claim from the access token sent with this request

            var userIdClaim = ctx.User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Sub)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !int.TryParse(userIdClaim, out var userId))
            {
                return Results.BadRequest(new { error = $"Invalid token: user ID claim is missing or invalid. {userIdClaim} ({ctx.User.Claims.Count()}) [{ string.Join(", ", ctx.User.Claims.Select(c => $"{c.Type}: {c.Value}")) }]" });
            }

            var name = ctx.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Name)?.Value;
            var username = ctx.User.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.UniqueName)?.Value;
            var role = ctx.User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.Role)?.Value;

            var member = new Member
            {
                Id = userId,
                Name = name ?? "",
                Username = username,
                Role = role is not null ? Enum.Parse<UserRole>(role) : UserRole.Member
            };

            return Results.Ok(new { user = member });
        }).RequireAuthorization();
#endregion

#region member management endpoints
        
        app.MapGet("/api/finance/members", async (FinanceDbContext db) =>
        {
            var members = await db.Members
                .Select(m => new
                {
                    m.Id,
                    m.Name,
                    m.Role,
                    m.Status,
                    m.JoinDate,
                    m.Username
                })
                .ToListAsync();

            return Results.Ok(members);
        }).RequireAuthorization("MembersRead");

        app.MapPost("/api/finance/member/update", async (MemberUpdateRequest request, FinanceDbContext db) =>
        {
            var member = await db.Members.FindAsync(request.Id);
            if (member is null) return Results.NotFound();

            member.Name = request.Name;
            member.Role = request.Role is not null ? Enum.Parse<UserRole>(request.Role) : UserRole.Member;
            member.Status = request.Status is not null ? Enum.Parse<UserState>(request.Status) : UserState.Active;

            await db.SaveChangesAsync();
            return Results.Ok(member);
        }).RequireAuthorization("MembersWrite");

        app.MapDelete("/api/finance/members/{id:int}", async (int id, FinanceDbContext db) =>
        {
            var member = await db.Members.FindAsync(id);
            if (member is null) return Results.NotFound();

            var hasPayments = db.ExpensePayments.Any(ep=> ep.UserId == id) && db.Expenses.Any(e => e.Payer == id);
            if(hasPayments)
            {
                member.Status = UserState.Deactivated;
                await db.SaveChangesAsync();
                return Results.BadRequest(new { error = "Cannot Delete! It is associated expenses. User Deactivated" });
            }

            db.Members.Remove(member);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization("MembersWrite");
#endregion

#region expense management endpoints
        app.MapGet("/api/finance/expenses", async (FinanceDbContext db) =>
        {
            try
            {
                var expenses = await db.Expenses
                    .Include(e => e.Payments)
                    .ToListAsync();
                return Results.Ok(expenses);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error occurred while fetching expenses: {ex.Message}");
                return Results.Problem("An error occurred while fetching expenses.");
            }
        }).RequireAuthorization();

        app.MapPost("/api/finance/expenses", async (Expense expense, FinanceDbContext db) =>
        {
            // Ensure all payments have the expense ID set and create fresh instances
            if (expense.Payments != null && expense.Payments.Count > 0)
            {
                var payments = new List<ExpensePayment>();
                foreach (var payment in expense.Payments)
                {
                    payments.Add(new ExpensePayment
                    {
                        UserId = payment.UserId,
                        AmountToPay = payment.AmountToPay,
                        Status = payment.Status
                    });
                }
                expense.Payments = payments;
            }

            db.Expenses.Add(expense);
            await db.SaveChangesAsync();
            return Results.Created($"/api/finance/expenses/{expense.Id}", expense);
        }).RequireAuthorization();

        app.MapPut("/api/finance/expenses/{id:int}", async (int id, Expense updatedExpense, FinanceDbContext db) =>
        {
            var expense = await db.Expenses
                .Include(e => e.Payments)
                .FirstOrDefaultAsync(e => e.Id == id);
            if (expense is null) return Results.NotFound();

            expense.Name = updatedExpense.Name;
            expense.Payment = updatedExpense.Payment;
            expense.Payer = updatedExpense.Payer;
            expense.Date = updatedExpense.Date;
            expense.Status = updatedExpense.Status;

            // Handle payments collection - remove all existing and re-add all from request
            if (updatedExpense.Payments != null)
            {
                // Remove all existing payments for this expense
                db.ExpensePayments.RemoveRange(expense.Payments);
                
                // Add all new payments from the request
                foreach (var payment in updatedExpense.Payments)
                {
                    var newPayment = new ExpensePayment
                    {
                        UserId = payment.UserId,
                        AmountToPay = payment.AmountToPay,
                        Status = payment.Status,
                        ExpenseId = expense.Id
                    };
                    db.ExpensePayments.Add(newPayment);
                }
            }

            await db.SaveChangesAsync();
            return Results.Ok(expense);
        }).RequireAuthorization();

        app.MapDelete("/api/finance/expenses/{id:int}", async (int id, FinanceDbContext db) =>
        {
            var expense = await db.Expenses.FindAsync(id);
            if (expense is null) return Results.NotFound();

            db.Expenses.Remove(expense);
            await db.SaveChangesAsync();
            return Results.NoContent();
        }).RequireAuthorization();
    
    #endregion
    }

    private static string? ValidateRegistration(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return "Name is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Username))
        {
            return "Username is required.";
        }

        if (string.IsNullOrWhiteSpace(request.Password))
        {
            return "Password is required.";
        }

        // if (string.IsNullOrWhiteSpace(request.Role))
        // {
        //     return "Role is required.";
        // }

        // if (!IsAllowedRole(request.Role))
        // {
        //     return "Role must be Admin, Treasurer, or Member.";
        // }

        return null;
    }
}
