import { create } from "zustand";

export interface Toast {
  id: number;
  message: string;
  type: "success" | "error" | "info";
  exiting: boolean;
}

interface ToastState {
  toasts: Toast[];
  showToast: (
    message: string,
    type?: "success" | "error" | "info",
    duration?: number,
  ) => void;
}

let toastIdCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  showToast: (message, type = "info", duration = 3000) => {
    const id = ++toastIdCounter;
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, exiting: false }],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.map((t) =>
          t.id === id ? { ...t, exiting: true } : t,
        ),
      }));
      setTimeout(() => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      }, 300);
    }, duration);
  },
}));
