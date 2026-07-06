using Microsoft.EntityFrameworkCore;

public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options) { }

    public DbSet<Member> Members { get; set; }
    public DbSet<Expense> Expenses { get; set; }
    public DbSet<ExpensePayment> ExpensePayments { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Member>(entity =>
        {
            entity.ToTable("Members");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Role).IsRequired().HasMaxLength(50);
            entity.Property(e => e.Status).HasConversion<string>();
            entity.Property(e => e.JoinDate).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Username).HasMaxLength(50);
            entity.Property(e => e.PasswordHash).IsRequired().HasMaxLength(512);
            entity.Property(e => e.PasswordSalt).IsRequired().HasMaxLength(256);
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.ToTable("Expenses");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Name).IsRequired().HasMaxLength(100);
            entity.Property(e => e.Payment).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Date).IsRequired().HasMaxLength(20);
            entity.Property(e => e.Status).HasConversion<string>();

            entity.HasMany(e => e.Payments)
                  .WithOne()
                  .HasForeignKey(p => p.ExpenseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ExpensePayment>(entity =>
        {
            entity.ToTable("ExpensePayments");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.AmountToPay).HasColumnType("decimal(18,2)");
            entity.Property(e => e.Status).HasConversion<string>();
        });
    }
}
