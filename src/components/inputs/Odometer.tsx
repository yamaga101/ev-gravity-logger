import { ChevronUp, ChevronDown } from "lucide-react";
import { RepeaterButton } from "./RepeaterButton.tsx";

interface OdometerDigitProps {
  value: number;
  onUp: () => void;
  onDown: () => void;
}

function OdometerDigit({ value, onUp, onDown }: OdometerDigitProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <RepeaterButton
        onClick={onUp}
        className="p-1 text-ev-primary hover:text-ev-primary-dark transition-colors"
      >
        <ChevronUp size={24} />
      </RepeaterButton>
      <div className="w-10 h-14 bg-gray-50 dark:bg-gray-800 border border-border dark:border-dark-border rounded-lg flex items-center justify-center overflow-hidden relative shadow-sm">
        <div className="text-3xl font-semibold text-text-primary dark:text-dark-text z-10">
          {value}
        </div>
      </div>
      <RepeaterButton
        onClick={onDown}
        className="p-1 text-ev-primary hover:text-ev-primary-dark transition-colors"
      >
        <ChevronDown size={24} />
      </RepeaterButton>
    </div>
  );
}

interface OdometerProps {
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function Odometer({ value, onChange, label }: OdometerProps) {
  const digits = String(value).padStart(6, "0").split("").map(Number);

  const updateDigit = (index: number, delta: number) => {
    const newDigits = [...digits];
    let val = newDigits[index] + delta;
    if (val > 9) val = 0;
    if (val < 0) val = 9;
    newDigits[index] = val;
    onChange(parseInt(newDigits.join("")));
  };

  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-text-muted text-xs font-medium uppercase tracking-wider pl-1">
        {label}
      </label>
      <div className="bg-white dark:bg-dark-surface border border-border dark:border-dark-border rounded-xl p-3 flex justify-center gap-2">
        {digits.map((d, i) => (
          <OdometerDigit
            key={i}
            value={d}
            onUp={() => updateDigit(i, 1)}
            onDown={() => updateDigit(i, -1)}
          />
        ))}
      </div>
    </div>
  );
}
