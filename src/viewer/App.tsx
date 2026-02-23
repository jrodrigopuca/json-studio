/**
 * Main App component for JSON Studio viewer.
 */

import { useCallback } from "react";
import { useStore } from "./store";
import { useJsonLoader } from "./hooks/useJsonLoader";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";

// Components
import {
  Toolbar,
  SearchBar,
  Breadcrumb,
  StatusBar,
  ToastProvider,
  useToast,
  TreeView,
  RawView,
  EditView,
  TableView,
  DiffView,
  SavedView,
  UnsavedChangesModal,
} from "./components";

import styles from "./App.module.css";

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

function AppContent() {
  const viewMode = useStore((s) => s.viewMode);
  const isValid = useStore((s) => s.isValid);
  const parseError = useStore((s) => s.parseError);
  const isParsing = useStore((s) => s.isParsing);
  const pendingViewMode = useStore((s) => s.pendingViewMode);
  const confirmViewChange = useStore((s) => s.confirmViewChange);
  const cancelViewChange = useStore((s) => s.cancelViewChange);
  const saveEditContent = useStore((s) => s.saveEditContent);
  const { show: showToast } = useToast();

  // Load JSON from URL or message
  useJsonLoader();

  // Setup keyboard shortcuts
  useKeyboardShortcuts();

  // Apply theme
  useTheme();

  // Handle save and change view
  const handleSaveAndChange = useCallback(() => {
    const saved = saveEditContent();
    if (saved) {
      showToast({ message: "Cambios guardados", type: "success" });
      confirmViewChange();
    } else {
      showToast({ message: "Error al guardar (JSON inválido)", type: "error" });
    }
  }, [saveEditContent, showToast, confirmViewChange]);

  // Handle discard and change view
  const handleDiscardAndChange = useCallback(() => {
    confirmViewChange();
  }, [confirmViewChange]);

  // Show current view
  const renderView = () => {
    if (isParsing) {
      return (
        <div className={styles.loading}>
          <span className={styles.spinner} />
          Parsing JSON...
        </div>
      );
    }

    if (!isValid && parseError) {
      return (
        <div className={styles.error}>
          <h2>Parse Error</h2>
          <p>{parseError.message}</p>
          <p>
            Line {parseError.line}, Column {parseError.column}
          </p>
        </div>
      );
    }

    switch (viewMode) {
      case "tree":
        return <TreeView />;
      case "raw":
        return <RawView />;
      case "edit":
        return <EditView />;
      case "table":
        return <TableView />;
      case "diff":
        return <DiffView />;
      case "saved":
        return <SavedView />;
      default:
        return <TreeView />;
    }
  };

  return (
    <div className={styles.app} data-view={viewMode}>
      <Toolbar />
      
      {viewMode === "tree" && <Breadcrumb />}
      
      <SearchBar />

      <main className={styles.main}>{renderView()}</main>

      <StatusBar />

      {/* Unsaved changes modal */}
      <UnsavedChangesModal
        isOpen={pendingViewMode !== null}
        onSave={handleSaveAndChange}
        onDiscard={handleDiscardAndChange}
        onCancel={cancelViewChange}
      />
    </div>
  );
}
