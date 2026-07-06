export enum PaymentStatus {
  PAID = "Paid",
  NOT_PAID = "NotPaid",
}

export enum ExpenseStatus {
  CLOSED = "Closed",
  OPEN = "Open",
  WAITING = "Waiting",
}

export enum UserState {
  ACTIVE = "Active",
  DEACTIVATED = "Deactivated",
}

export interface MemberDto {
  id: number;
  name: string;
  role: string;
  status: UserState;
  joinDate: string;
  username?: string;
}

export interface ExpensePaymentDto {
  userId: number;
  amountToPay: number;
  status: PaymentStatus;
}

export interface ExpenseDto {
  id: number;
  name: string;
  payment: number;
  payer: number;
  date: string;
  createdAt?: string;
  status: ExpenseStatus;
  payments: ExpensePaymentDto[];
}

export interface AuthResponseDto {
  user: MemberDto;
}

export type Member = MemberDto;
export type ExpensePayment = ExpensePaymentDto;
export type Expense = ExpenseDto;
export type AuthResponse = AuthResponseDto;
