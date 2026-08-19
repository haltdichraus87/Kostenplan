import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Category, Transaction } from "../types";

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

const currencyFormatter = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
});

export function MonthlyOverview({ transactions, categories }: Props) {
  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);
  const balance = income - expenses;

  const categoryById = new Map(categories.map((c) => [c.id, c]));
  const expenseByCategory = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== "expense") continue;
    expenseByCategory.set(
      t.categoryId,
      (expenseByCategory.get(t.categoryId) ?? 0) + t.amount,
    );
  }
  const chartData = [...expenseByCategory.entries()]
    .map(([categoryId, value]) => ({
      name: categoryById.get(categoryId)?.name ?? "Unbekannt",
      value,
      color: categoryById.get(categoryId)?.color ?? "#8a8f98",
    }))
    .sort((a, b) => b.value - a.value);

  return (
    <div className="monthly-overview">
      <div className="summary-cards">
        <div className="summary-card income">
          <span className="summary-label">Einnahmen</span>
          <span className="summary-value">{currencyFormatter.format(income)}</span>
        </div>
        <div className="summary-card expense">
          <span className="summary-label">Ausgaben</span>
          <span className="summary-value">{currencyFormatter.format(expenses)}</span>
        </div>
        <div className={`summary-card balance ${balance >= 0 ? "positive" : "negative"}`}>
          <span className="summary-label">Saldo</span>
          <span className="summary-value">{currencyFormatter.format(balance)}</span>
        </div>
      </div>

      {chartData.length > 0 ? (
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => currencyFormatter.format(Number(value))}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="chart-legend">
            {chartData.map((entry) => (
              <li key={entry.name}>
                <span className="category-dot" style={{ backgroundColor: entry.color }} />
                {entry.name}
                <span className="chart-legend-value">
                  {currencyFormatter.format(entry.value)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="empty-state">Noch keine Ausgaben zum Anzeigen.</p>
      )}
    </div>
  );
}
