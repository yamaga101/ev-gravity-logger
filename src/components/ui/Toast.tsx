import { useToastStore } from "../../store/useToastStore.ts";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-100 flex flex-col gap-2 w-[90vw] max-w-sm pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`rounded-lg px-4 py-3 text-sm font-medium pointer-events-auto shadow-lg backdrop-blur-sm ${
            t.type === "success"
              ? "border-l-4 border-ev-success bg-ev-success/10 text-ev-success dark:bg-ev-success/20"
              : t.type === "error"
                ? "border-l-4 border-ev-error bg-ev-error/10 text-ev-error dark:bg-ev-error/20"
                : "border-l-4 border-ev-primary bg-ev-primary/10 text-ev-primary dark:bg-ev-primary/20"
          } ${t.exiting ? "toast-exit" : "toast-enter"}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
