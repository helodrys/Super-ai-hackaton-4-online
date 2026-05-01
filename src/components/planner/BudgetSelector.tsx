import { budgetOptions } from "../../data/plannerOptions";

type BudgetSelectorProps = {
  selected: string;
  onSelect: (label: string) => void;
};

export function BudgetSelector({ selected, onSelect }: BudgetSelectorProps) {
  return (
    <div className="budget-grid">
      {budgetOptions.map((option) => (
        <button
          type="button"
          key={option.label}
          className={`budget-option ${selected === option.label ? "budget-option-selected" : ""}`}
          onClick={() => onSelect(option.label)}
        >
          <span>{option.label}</span>
          <strong>{option.value}</strong>
          <small>{option.note}</small>
        </button>
      ))}
    </div>
  );
}
