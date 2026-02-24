/**
 * Main App component for JSON Spark viewer.
 */

import { useCallback } from "react";
import { useStore } from "./store";
import { useJsonLoader } from "./hooks/useJsonLoader";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";
import { useTheme } from "./hooks/useTheme";
import { useI18n } from "./hooks/useI18n";

// Components
import {
  Toolbar,
  SearchBar,
  Breadcrumb,
  StatusBar,
  ToastProvider,
  useToast,
  TreeView,
  LargeFileTreeView,
  RawView,
  EditView,
  TableView,
  DiffView,
  SavedView,
  ConvertView,
  UnsavedChangesModal,
  LargeContentWarningModal,
  ShortcutsHelpModal,
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
  const isLargeFile = useStore((s) => s.isLargeFile);
  const pendingViewMode = useStore((s) => s.pendingViewMode);
  const pendingSizeWarning = useStore((s) => s.pendingSizeWarning);
  const fileSize = useStore((s) => s.fileSize);
  const showShortcutsHelp = useStore((s) => s.showShortcutsHelp);
  const setShowShortcutsHelp = useStore((s) => s.setShowShortcutsHelp);
  const confirmViewChange = useStore((s) => s.confirmViewChange);
  const cancelViewChange = useStore((s) => s.cancelViewChange);
  const confirmSizeWarning = useStore((s) => s.confirmSizeWarning);
  const cancelSizeWarning = useStore((s) => s.cancelSizeWarning);
  const saveEditContent = useStore((s) => s.saveEditContent);
  const { show: showToast } = useToast();
  const { t } = useI18n();

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
      showToast({ message: t("app.toast.changesSaved"), type: "success" });
      confirmViewChange();
    } else {
      showToast({ message: t("app.toast.saveError"), type: "error" });
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
          {t("app.loading.parsingJson")}
        </div>
      );
    }

    if (!isValid && parseError) {
      return (
        <div className={styles.error}>
          <h2>{t("app.error.parseErrorTitle")}</h2>
          <p>{parseError.message}</p>
          <p>
            {t("app.error.parseErrorLocation", { line: parseError.line, column: parseError.column })}
          </p>
        </div>
      );
    }

    // Large file mode — only the virtualized tree
    if (isLargeFile) {
      return <LargeFileTreeView />;
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
      case "convert":
        return <ConvertView />;
      default:
        return <TreeView />;
    }
  };

  return (
    <div className={styles.app} data-view={isLargeFile ? "large-file" : viewMode}>
      <Toolbar />
      
      {!isLargeFile && viewMode === "tree" && <Breadcrumb />}
      
      {!isLargeFile && <SearchBar />}

      <main className={styles.main}>{renderView()}</main>

      <StatusBar />

      {/* Unsaved changes modal */}
      <UnsavedChangesModal
        isOpen={pendingViewMode !== null}
        onSave={handleSaveAndChange}
        onDiscard={handleDiscardAndChange}
        onCancel={cancelViewChange}
      />

      {/* Large content warning modal */}
      <LargeContentWarningModal
        isOpen={pendingSizeWarning !== null}
        fileSize={fileSize}
        viewName={pendingSizeWarning === "edit" ? "Edit" : "Diff"}
        onContinue={confirmSizeWarning}
        onCancel={cancelSizeWarning}
      />

      {/* Keyboard shortcuts help modal */}
      <ShortcutsHelpModal
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
      />
    </div>
  );
}
