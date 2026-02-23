/**
 * React-based viewer initialization for content scripts.
 * Replaces the old vanilla viewer-init.ts.
 */

import { createRoot, type Root } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import type { ContentTypeClass } from "@shared/types";
import "./styles/index.css";

/** Options for initializing the viewer. */
export interface ViewerOptions {
  /** Container element to render into. */
  container: HTMLElement;
  /** The raw JSON string. */
  rawJson: string;
  /** The detected content-type classification. */
  contentType?: ContentTypeClass;
  /** The source URL. */
  url?: string;
}

let root: Root | null = null;

/**
 * Initializes and mounts the JSON Studio React viewer.
 *
 * @param options - Viewer configuration
 * @returns Cleanup function to unmount
 */
export function initViewer(options: ViewerOptions): () => void {
  const {
    container,
    rawJson,
    contentType = "application/json",
    url = "",
  } = options;

  // Store data for useJsonLoader hook to pick up
  sessionStorage.setItem(
    "json-studio-data",
    JSON.stringify({
      content: rawJson,
      url,
      contentType,
    })
  );

  // Create React root and render
  root = createRoot(container);
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );

  // Return cleanup function
  return () => {
    if (root) {
      root.unmount();
      root = null;
    }
  };
}

export default initViewer;
