import type { ReactNode } from "react";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleIcon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({
  isOpen,
  onClose,
  title,
  titleIcon,
  children,
  footer,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-dark-surface w-full sm:max-w-lg h-[90vh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-border dark:border-dark-border">
          <h2 className="text-lg font-semibold text-text-primary dark:text-dark-text flex items-center gap-2">
            {titleIcon}
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-text-muted hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 custom-scroll">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="p-4 border-t border-border dark:border-dark-border">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
