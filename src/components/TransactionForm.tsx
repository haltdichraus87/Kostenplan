import { useState } from "react";
import type { Category, Transaction, TransactionType } from "../types";

interface Props {
  categories: Category[];
  onAdd: (transaction: Omit<Transaction, "id">) => void;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function TransactionForm({ categories, onAdd }: Props) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");

  const categoriesForType = categories.filter((c) => c.type === type);
  const [categoryId, setCategoryId] = useState(categoriesForType[0]?.id ?? "");

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    const first = categories.find((c) => c.type === nextType);
    setCategoryId(first?.id ?? "");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = Number(amount.replace(",", "."));
    if (!parsedAmount || parsedAmount <= 0 || !categoryId) return;

    onAdd({
      type,
      amount: parsedAmount,
      date,
      categoryId,
      note: note.trim() || undefined,
    });

    setAmount("");
    setNote("");
  }

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="type-toggle">
        <button
          type="button"
          className={type === "expense" ? "active expense" : "expense"}
          onClick={() => handleTypeChange("expense")}
        >
          Ausgabe
        </button>
        <button
          type="button"
          className={type === "income" ? "active income" : "income"}
          onClick={() => handleTypeChange("income")}
        >
          Einnahme
        </button>
      </div>

      <div className="form-row">
        <label>
          Betrag (€)
          <input
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </label>

        <label>
          Datum
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </label>
      </div>

      <div className="form-row">
        <label>
          Kategorie
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            {categoriesForType.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Notiz (optional)
          <input
            type="text"
            placeholder="z. B. Supermarkt"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>
      </div>

      <button type="submit" className="submit-button">
        Hinzufügen
      </button>
    </form>
  );
}
