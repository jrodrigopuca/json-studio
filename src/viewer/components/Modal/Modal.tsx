/**
 * Modal component for confirmations and dialogs.
 * Uses createPortal to render outside the component tree to avoid
 * stacking context issues with backdrop-filter.
 */

import { useEffect, useCallback, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { formatSize } from "../../core/formatter";
import { useI18n } from "../../hooks/useI18n";
import styles from "./Modal.module.css";

interface ModalProps {
  isOpen: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  actions?: ReactNode;
}

export function Modal({ isOpen, title, children, onClose, actions }: ModalProps) {
  // Handle escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  // Use portal to render modal at document root to avoid stacking context issues
  return createPortal(
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className={styles.header}>
          <h2 id="modal-title" className={styles.title}>
            {title}
          </h2>
        </header>
        <div className={styles.content}>{children}</div>
        {actions && <footer className={styles.actions}>{actions}</footer>}
      </div>
    </div>,
    document.body
  );
}

// Convenience component for unsaved changes confirmation
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesModal({
  isOpen,
  onSave,
  onDiscard,
  onCancel,
}: UnsavedChangesModalProps) {
  const { t } = useI18n();
  return (
    <Modal
      isOpen={isOpen}
      title={t("modal.unsavedChanges.title")}
      onClose={onCancel}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={onCancel}>
            {t("modal.unsavedChanges.cancel")}
          </button>
          <button className={styles.buttonSecondary} onClick={onDiscard}>
            {t("modal.unsavedChanges.discard")}
          </button>
          <button className={styles.buttonPrimary} onClick={onSave}>
            {t("modal.unsavedChanges.save")}
          </button>
        </>
      }
    >
      <p>{t("modal.unsavedChanges.message")}</p>
    </Modal>
  );
}

// Warning modal when opening Edit/Diff with large content
interface LargeContentWarningModalProps {
  isOpen: boolean;
  fileSize: number;
  viewName: string;
  onContinue: () => void;
  onCancel: () => void;
}

export function LargeContentWarningModal({
  isOpen,
  fileSize,
  viewName,
  onContinue,
  onCancel,
}: LargeContentWarningModalProps) {
  const { t } = useI18n();
  return (
    <Modal
      isOpen={isOpen}
      title={t("modal.largeContent.title")}
      onClose={onCancel}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={onCancel}>
            {t("modal.largeContent.cancel")}
          </button>
          <button className={styles.buttonPrimary} onClick={onContinue}>
            {t("modal.largeContent.continue")}
          </button>
        </>
      }
    >
      <p>
        {t("modal.largeContent.message", {
          size: formatSize(fileSize),
          view: viewName,
        })}
      </p>
      <p>
        <strong>{t("modal.largeContent.warning")}</strong>
      </p>
    </Modal>
  );
}

// Modal for saving current JSON to favorites
interface SaveJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  currentSize: number;
  savedCount: number;
  maxSize?: number;
  maxCount?: number;
}

export function SaveJsonModal({
  isOpen,
  onClose,
  onSave,
  currentSize,
  savedCount,
  maxSize = 500 * 1024,
  maxCount = 10,
}: SaveJsonModalProps) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const isOverSize = currentSize > maxSize;
  const isOverCount = savedCount >= maxCount;
  const canSave = name.trim() && !isOverSize && !isOverCount;

  const handleSave = () => {
    if (canSave) {
      onSave(name.trim());
      setName("");
    }
  };

  const handleClose = () => {
    setName("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      title={t("modal.saveJson.title")}
      onClose={handleClose}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={handleClose}>
            {t("modal.saveJson.cancel")}
          </button>
          <button
            className={styles.buttonPrimary}
            onClick={handleSave}
            disabled={!canSave}
          >
            {t("modal.saveJson.save")}
          </button>
        </>
      }
    >
      <div className={styles.saveForm}>
        <input
          type="text"
          className={styles.input}
          placeholder={t("modal.saveJson.placeholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
        />
        <p className={styles.saveInfo}>
          {t("modal.saveJson.size", { size: formatSize(currentSize) })}
          {isOverSize && (
            <span className={styles.warning}> {t("modal.saveJson.sizeWarning", { maxSize: formatSize(maxSize) })}</span>
          )}
        </p>
        <p className={styles.saveInfo}>
          {t("modal.saveJson.savedCount", { count: String(savedCount), max: String(maxCount) })}
          {isOverCount && <span className={styles.warning}> {t("modal.saveJson.limitReached")}</span>}
        </p>
      </div>
    </Modal>
  );
}

// Modal for keyboard shortcuts reference
interface ShortcutsHelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SHORTCUTS = [
  {
    category: "modal.shortcuts.navigation" as const,
    items: [
      { keys: ["⌥", "1"], desc: "modal.shortcuts.treeView" as const },
      { keys: ["⌥", "2"], desc: "modal.shortcuts.rawView" as const },
      { keys: ["⌥", "3"], desc: "modal.shortcuts.tableView" as const },
      { keys: ["⌥", "4"], desc: "modal.shortcuts.diffView" as const },
      { keys: ["⌥", "5"], desc: "modal.shortcuts.editView" as const },
      { keys: ["⌥", "6"], desc: "modal.shortcuts.savedView" as const },
    ],
  },
  {
    category: "modal.shortcuts.search" as const,
    items: [
      { keys: ["⌘", "F"], desc: "modal.shortcuts.openSearch" as const },
      { keys: ["⌥", "F"], desc: "modal.shortcuts.openSearchAlt" as const },
      { keys: ["Esc"], desc: "modal.shortcuts.closeSearch" as const },
      { keys: ["↑", "↓"], desc: "modal.shortcuts.prevNextResult" as const },
      { keys: ["Enter"], desc: "modal.shortcuts.goToNextResult" as const },
    ],
  },
  {
    category: "modal.shortcuts.treeViewCategory" as const,
    items: [
      { keys: ["⌥", "E"], desc: "modal.shortcuts.expandAllNodes" as const },
      { keys: ["⌥", "C"], desc: "modal.shortcuts.collapseAllNodes" as const },
      { keys: ["⌥", "S"], desc: "modal.shortcuts.sortByKeys" as const },
    ],
  },
  {
    category: "modal.shortcuts.rawEditView" as const,
    items: [
      { keys: ["⌥", "L"], desc: "modal.shortcuts.toggleLineNumbers" as const },
    ],
  },
  {
    category: "modal.shortcuts.editing" as const,
    items: [
      { keys: ["⌘", "Z"], desc: "modal.shortcuts.undo" as const },
      { keys: ["⌘", "⇧", "Z"], desc: "modal.shortcuts.redo" as const },
      { keys: ["⌘", "S"], desc: "modal.shortcuts.saveChanges" as const },
    ],
  },
  {
    category: "modal.shortcuts.general" as const,
    items: [
      { keys: ["?"], desc: "modal.shortcuts.showHideHelp" as const },
    ],
  },
];

export function ShortcutsHelpModal({ isOpen, onClose }: ShortcutsHelpModalProps) {
  const { t } = useI18n();
  return (
    <Modal
      isOpen={isOpen}
      title={t("modal.shortcuts.title")}
      onClose={onClose}
      actions={
        <button className={styles.buttonPrimary} onClick={onClose}>
          {t("modal.shortcuts.close")}
        </button>
      }
    >
      <div className={styles.shortcutsGrid}>
        {SHORTCUTS.map((section) => (
          <div key={section.category} className={styles.shortcutsSection}>
            <h3 className={styles.shortcutsCategory}>{t(section.category)}</h3>
            <dl className={styles.shortcutsList}>
              {section.items.map((item, idx) => (
                <div key={idx} className={styles.shortcutItem}>
                  <dt className={styles.shortcutKeys}>
                    {item.keys.map((k, i) => (
                      <kbd key={i} className={styles.kbd}>{k}</kbd>
                    ))}
                  </dt>
                  <dd className={styles.shortcutDesc}>{t(item.desc)}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </Modal>
  );
}
