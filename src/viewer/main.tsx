/**
 * Universal entry point for JSON Spark viewer.
 *
 * Used by both the development server (auto-mounts to #root) and
 * the Chrome extension (exposes initViewer for content scripts).
 *
 * Vite 7 requires top-level component usage (JSX rendering) to
 * properly extract CSS Modules. This file satisfies that requirement
 * while also exposing the initViewer API for the extension.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles/index.css";
import { initViewer } from "./init";

// Expose initViewer globally for the content script.
// Vite strips ES module exports from HTML entries, so we use window.
// The content script imports this file and accesses window.initViewer.
(window as typeof window & { initViewer: typeof initViewer }).initViewer =
  initViewer;

// Auto-mount for development / standalone use.
// In extension context, detector.ts sets data-extension-init on
// the container to skip auto-mount — initViewer() handles rendering.
const rootEl = document.getElementById("root");
if (rootEl && !rootEl.dataset.extensionInit) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
