/**
 * React-based viewer initialization for content scripts.
 * Replaces the old vanilla viewer-init.ts.
 */

import { createRoot, type Root } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import type { ContentTypeClass } from "@shared/types";
import { useStore } from "./store";
import { parseJSON } from "./core/parser";
import { prettyPrint } from "./core/formatter";
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
 * Initializes and mounts the JSON Spark React viewer.
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

  // Cleanup any existing root first
  if (root) {
    root.unmount();
    root = null;
  }
  
  // Clear container to allow createRoot to work properly
  container.innerHTML = "";

  // Reset store and load JSON directly (bypasses sessionStorage issues with StrictMode)
  const store = useStore.getState();
  store.reset();
  
  // Parse and load the JSON into store
  const result = parseJSON(rawJson);
  if (result.ok) {
    const formatted = prettyPrint(rawJson);
    store.setJson(formatted, result.nodes, {
      fileSize: new Blob([formatted]).size,
      totalKeys: result.totalKeys,
      maxDepth: result.maxDepth,
      url,
      contentType,
    });
  } else {
    store.setParseError(result.error);
  }

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
