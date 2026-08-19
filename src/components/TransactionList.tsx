import type { Category, Transaction } from "../types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
  onDelete: (id: string) => void;
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

export function TransactionList({ transactions, categories, onDelete }: Props) {
  if (transactions.length === 0) {
    return <p className="empty-state">Noch keine Einträge für diesen Monat.</p>;
  }

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const sorted = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <ul className="transaction-list">
      {sorted.map((t) => {
        const category = categoryById.get(t.categoryId);
        return (
          <li key={t.id} className="transaction-item">
            <span
              className="category-dot"
              style={{ backgroundColor: category?.color ?? "#8a8f98" }}
            />
            <div className="transaction-main">
              <span className="transaction-category">
                {category?.name ?? "Unbekannt"}
              </span>
              {t.note && <span className="transaction-note">{t.note}</span>}
            </div>
            <span className="transaction-date">
              {dateFormatter.format(new Date(t.date))}
            </span>
            <span className={`transaction-amount ${t.type}`}>
              {t.type === "expense" ? "-" : "+"}
              {currencyFormatter.format(t.amount)}
            </span>
            <button
              type="button"
              className="delete-button"
              aria-label="Eintrag löschen"
              onClick={() => onDelete(t.id)}
            >
              ×
            </button>
          </li>
        );
      })}
    </ul>
  );
}
