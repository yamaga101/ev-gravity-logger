import { RepeaterButton } from "./RepeaterButton.tsx";

interface SmartNumberInputProps {
  label: string;
  value: number;
  unit: string;
  onChange: (value: number) => void;
  steps?: number[];
  min?: number;
  max?: number;
  error?: boolean;
}

export function SmartNumberInput({
  label,
  value,
  unit,
  onChange,
  steps = [-10, -1, 1, 10],
  min = 0,
  max = 999999,
  error = false,
}: SmartNumberInputProps) {
  const adjust = (delta: number) => {
    let next = parseFloat((value + delta).toFixed(1));
    if (next < min) next = min;
    if (next > max) next = max;
    onChange(next);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" || e.key === "ArrowRight") {
      e.preventDefault();
      adjust(e.shiftKey ? steps[3] : steps[2]);
    } else if (e.key === "ArrowDown" || e.key === "ArrowLeft") {
      e.preventDefault();
      adjust(e.shiftKey ? steps[0] : steps[1]);
    }
  };

  return (
    <div className="flex flex-col gap-1 mb-2">
      <label className="text-text-muted text-xs font-medium uppercase tracking-wider pl-1">
        {label}
      </label>
      <div
        className={`flex items-center justify-between rounded-lg border bg-white dark:bg-dark-surface p-1 transition-colors focus-within:border-ev-primary focus-within:ring-2 focus-within:ring-ev-primary/20 ${
          error
            ? "border-ev-error ring-2 ring-ev-error/20 shake"
            : "border-border dark:border-dark-border"
        }`}
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <div className="flex gap-1">
          {steps
            .filter((s) => s < 0)
            .map((step) => (
              <RepeaterButton
                key={step}
                onClick={() => adjust(step)}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800 text-ev-error font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                {step}
              </RepeaterButton>
            ))}
        </div>
        <div className="flex items-baseline gap-1 flex-1 justify-center">
          <input
            type="number"
            value={value}
            onChange={(e) => {
              const parsed = parseFloat(e.target.value);
              if (!isNaN(parsed)) onChange(parsed);
            }}
            className="w-20 bg-transparent text-2xl font-semibold text-ev-primary text-center focus:outline-none appearance-none p-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-text-muted">{unit}</span>
        </div>
        <div className="flex gap-1">
          {steps
            .filter((s) => s > 0)
            .reverse()
            .map((step) => (
              <RepeaterButton
                key={step}
                onClick={() => adjust(step)}
                className="h-10 w-10 flex items-center justify-center rounded-md bg-gray-50 dark:bg-gray-800 text-ev-primary font-bold text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors active:scale-95"
              >
                +{step}
              </RepeaterButton>
            ))}
        </div>
      </div>
    </div>
  );
}
