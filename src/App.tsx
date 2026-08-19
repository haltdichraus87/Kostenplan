import { useMemo, useState } from "react";
import "./App.css";
import { MonthSelector } from "./components/MonthSelector";
import { MonthlyOverview } from "./components/MonthlyOverview";
import { TransactionForm } from "./components/TransactionForm";
import { TransactionList } from "./components/TransactionList";
import { DEFAULT_CATEGORIES } from "./defaultCategories";
import type { Transaction } from "./types";
import { useLocalStorageState } from "./useLocalStorageState";

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function App() {
  const [transactions, setTransactions] = useLocalStorageState<Transaction[]>(
    "kostenplan.transactions",
    [],
  );
  const [month, setMonth] = useState(currentMonth());

  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.date.startsWith(month)),
    [transactions, month],
  );

  function addTransaction(transaction: Omit<Transaction, "id">) {
    setTransactions((prev) => [
      ...prev,
      { ...transaction, id: crypto.randomUUID() },
    ]);
  }

  function deleteTransaction(id: string) {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Kostenplan</h1>
        <p className="tagline">Dein einfacher Budgetplaner</p>
      </header>

      <main className="app-main">
        <section className="card">
          <MonthSelector month={month} onChange={setMonth} />
          <MonthlyOverview
            transactions={monthTransactions}
            categories={DEFAULT_CATEGORIES}
          />
        </section>

        <section className="card">
          <h2>Neuer Eintrag</h2>
          <TransactionForm categories={DEFAULT_CATEGORIES} onAdd={addTransaction} />
        </section>

        <section className="card">
          <h2>Einträge</h2>
          <TransactionList
            transactions={monthTransactions}
            categories={DEFAULT_CATEGORIES}
            onDelete={deleteTransaction}
          />
        </section>
      </main>
    </div>
  );
}

export default App;
