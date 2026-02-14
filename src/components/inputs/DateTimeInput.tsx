interface DateTimeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: boolean;
}

export function DateTimeInput({
  label,
  value,
  onChange,
  error = false,
}: DateTimeInputProps) {
  return (
    <div className="flex flex-col gap-1 mb-4">
      <label className="text-text-muted text-xs font-medium uppercase tracking-wider pl-1">
        {label}
      </label>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full rounded-lg border bg-white dark:bg-dark-surface p-3 text-lg font-medium text-center text-text-primary dark:text-dark-text focus:outline-none focus:border-ev-primary focus:ring-2 focus:ring-ev-primary/20 transition-colors ${
          error
            ? "border-ev-error ring-2 ring-ev-error/20 shake"
            : "border-border dark:border-dark-border"
        }`}
      />
    </div>
  );
}
