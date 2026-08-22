import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

import { reportarErro } from "./lib/reportarErro";

// Captura de erros globais fora do React
window.onerror = (message, source, lineno, colno, error) => {
  reportarErro(error || message, {
    severity: 'critical',
    metadata: { source, lineno, colno, type: 'window.onerror' }
  });
};

window.onunhandledrejection = (event) => {
  reportarErro(event.reason, {
    severity: 'critical',
    metadata: { type: 'unhandledrejection' }
  });
};

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
