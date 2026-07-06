public class ExpensePayment
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public decimal AmountToPay { get; set; }
    public PaymentStatus Status { get; set; }
    public int ExpenseId { get; set; }
}