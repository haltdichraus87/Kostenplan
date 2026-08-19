export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  amount: number; // always positive; sign comes from type
  type: TransactionType;
  categoryId: string;
  note?: string;
}
