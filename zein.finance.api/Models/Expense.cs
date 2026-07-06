public class Expense
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Payment { get; set; }
    public int Payer { get; set; }
    public string Date { get; set; } = string.Empty;
    public ExpenseStatus Status { get; set; }
    public List<ExpensePayment> Payments { get; set; } = new();
}