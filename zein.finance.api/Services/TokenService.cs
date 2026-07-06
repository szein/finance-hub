using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

public class TokenService
{
    private readonly JwtOptions _options;

    public TokenService(IOptions<JwtOptions> options)
    {
        _options = options.Value;
    }

    public AuthResponse CreateToken(Member member)
    {
        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, member.Id.ToString()),
            new(JwtRegisteredClaimNames.UniqueName, member.Username ?? string.Empty),
            new(System.Security.Claims.ClaimTypes.Role, member.Role.ToString()),
            new(System.Security.Claims.ClaimTypes.Name, member.Name)
        };

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_options.Key));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expires = DateTime.UtcNow.AddMinutes(_options.AccessTokenMinutes);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        var jwt = new JwtSecurityTokenHandler().WriteToken(token);
        return new AuthResponse(jwt, expires, member);
    }
}
