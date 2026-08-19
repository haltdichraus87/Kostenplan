import type { Category } from "./types";

export const DEFAULT_CATEGORIES: Category[] = [
  { id: "gehalt", name: "Gehalt", type: "income", color: "#2f9e64" },
  { id: "nebeneinkommen", name: "Nebeneinkommen", type: "income", color: "#5cb88a" },
  { id: "sonstiges-einnahmen", name: "Sonstiges", type: "income", color: "#8fd4b0" },
  { id: "miete", name: "Miete", type: "expense", color: "#e0575b" },
  { id: "lebensmittel", name: "Lebensmittel", type: "expense", color: "#e8823a" },
  { id: "transport", name: "Transport", type: "expense", color: "#e0a92f" },
  { id: "freizeit", name: "Freizeit", type: "expense", color: "#9066c9" },
  { id: "gesundheit", name: "Gesundheit", type: "expense", color: "#3a8ee0" },
  { id: "versicherung", name: "Versicherung", type: "expense", color: "#556fe0" },
  { id: "sonstiges-ausgaben", name: "Sonstiges", type: "expense", color: "#8a8f98" },
];
