import { useRef, type ReactNode } from "react";
import { useRepeater } from "../../hooks/useRepeater.ts";

interface RepeaterButtonProps {
  onClick: () => void;
  className?: string;
  children: ReactNode;
}

export function RepeaterButton({
  onClick,
  className = "",
  children,
}: RepeaterButtonProps) {
  const repeater = useRepeater(onClick);
  const hasStartedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    repeater.start();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    hasStartedRef.current = false;
    repeater.stop();
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
      className={`${className} no-select`}
      type="button"
    >
      {children}
    </button>
  );
}
