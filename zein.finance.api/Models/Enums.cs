using System.Runtime.Serialization;
using System.Text.Json.Serialization;

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum PaymentStatus
{
    [EnumMember(Value = "NotPaid")]
    NotPaid,
    [EnumMember(Value = "Paid")]
    Paid
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum ExpenseStatus
{
    [EnumMember(Value = "Closed")]
    Closed,
    [EnumMember(Value = "Open")]
    Open,
    [EnumMember(Value = "Waiting")]
    Waiting
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserState
{
    [EnumMember(Value = "active")]
    Active,
    [EnumMember(Value = "deactivated")]
    Deactivated
}

[JsonConverter(typeof(JsonStringEnumConverter))]
public enum UserRole
{
    [EnumMember(Value = "admin")]
    Admin,
    [EnumMember(Value = "member")]
    Member
}
