/**
 * Modal component for confirmations and dialogs.
 */

import { useEffect, useCallback, type ReactNode } from "react";
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

  return (
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
    </div>
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
  return (
    <Modal
      isOpen={isOpen}
      title="Cambios sin guardar"
      onClose={onCancel}
      actions={
        <>
          <button className={styles.buttonSecondary} onClick={onCancel}>
            Cancelar
          </button>
          <button className={styles.buttonSecondary} onClick={onDiscard}>
            Descartar cambios
          </button>
          <button className={styles.buttonPrimary} onClick={onSave}>
            Guardar cambios
          </button>
        </>
      }
    >
      <p>Tienes cambios sin guardar en el editor. ¿Qué deseas hacer?</p>
    </Modal>
  );
}
