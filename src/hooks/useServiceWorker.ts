import { useRegisterSW } from "virtual:pwa-register/react";

export function useServiceWorker() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration) {
      if (registration) {
        // Check for updates every hour
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000);
      }
    },
  });

  const update = () => {
    updateServiceWorker(true);
  };

  const dismiss = () => {
    setNeedRefresh(false);
  };

  return { needRefresh, update, dismiss };
}
