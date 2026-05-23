import React from "react";
import { createRoot } from "react-dom/client";
import App from "../app.tsx/app.tsx";

const container = document.getElementById("root");

if (!container) {
  throw new Error("Root element not found. Ensure your HTML contains an element with id=\"root\".");
}

const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
