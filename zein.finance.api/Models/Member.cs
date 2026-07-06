public class Member
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Member;
    public UserState Status { get; set; }
    public string JoinDate { get; set; } = string.Empty;
    public string? Username { get; set; }
    public string PasswordHash { get; set; } = string.Empty;
    public string PasswordSalt { get; set; } = string.Empty;
}
