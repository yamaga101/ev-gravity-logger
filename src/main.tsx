import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { APP_VERSION } from "./constants/defaults";

// boot diagnostic: logcat で main.tsx が load 完了したかを確認できる
console.log(`[ev-manager] boot v${APP_VERSION}`);

// 全 unhandled error / promise rejection を console に出して logcat 診断可能に
window.addEventListener("error", (e) => {
  console.error("[ev-manager] unhandled error", e.message, e.filename, e.lineno, e.colno, e.error);
});
window.addEventListener("unhandledrejection", (e) => {
  console.error("[ev-manager] unhandled rejection", e.reason);
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
