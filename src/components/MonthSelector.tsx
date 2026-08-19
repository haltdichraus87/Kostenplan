interface Props {
  month: string; // YYYY-MM
  onChange: (month: string) => void;
}

const monthFormatter = new Intl.DateTimeFormat("de-DE", {
  month: "long",
  year: "numeric",
});

function shiftMonth(month: string, delta: number) {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function MonthSelector({ month, onChange }: Props) {
  const label = monthFormatter.format(new Date(`${month}-01T00:00:00`));

  return (
    <div className="month-selector">
      <button type="button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Vorheriger Monat">
        ‹
      </button>
      <span className="month-label">{label}</span>
      <button type="button" onClick={() => onChange(shiftMonth(month, 1))} aria-label="Nächster Monat">
        ›
      </button>
    </div>
  );
}
