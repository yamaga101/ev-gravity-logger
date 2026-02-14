interface ProgressRingProps {
  radius?: number;
  stroke?: number;
  progress?: number;
  color?: string;
}

export function ProgressRing({
  radius = 70,
  stroke = 6,
  progress = 0,
  color = "#10B981",
}: ProgressRingProps) {
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - (progress / 100) * circumference;

  return (
    <svg height={radius * 2} width={radius * 2} className="mx-auto">
      <circle
        stroke="currentColor"
        className="text-gray-200 dark:text-gray-700"
        fill="transparent"
        strokeWidth={stroke}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
      <circle
        className="progress-ring-circle"
        stroke={color}
        fill="transparent"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        r={normalizedRadius}
        cx={radius}
        cy={radius}
      />
    </svg>
  );
}
