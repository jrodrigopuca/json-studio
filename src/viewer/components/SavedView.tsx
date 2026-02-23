/**
 * SavedView component - manage saved JSON documents.
 */

import { useState } from "react";
import { useStore, type SavedJson } from "../store";
import { useToast } from "./Toast";
import styles from "./SavedView.module.css";

const MAX_SIZE_KB = 500;

export function SavedView() {
  const rawJson = useStore((s) => s.rawJson);
  const savedJsons = useStore((s) => s.savedJsons);
  const saveCurrentJson = useStore((s) => s.saveCurrentJson);
  const loadSavedJson = useStore((s) => s.loadSavedJson);
  const deleteSavedJson = useStore((s) => s.deleteSavedJson);
  const renameSavedJson = useStore((s) => s.renameSavedJson);
  const { show: showToast } = useToast();

  const [saveName, setSaveName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const currentSize = new Blob([rawJson]).size;
  const isOverSize = currentSize > MAX_SIZE_KB * 1024;
  const canSave = rawJson && saveName.trim() && !isOverSize && savedJsons.length < 10;

  const handleSave = () => {
    if (!canSave) return;
    
    const success = saveCurrentJson(saveName.trim());
    if (success) {
      showToast({ message: `"${saveName}" guardado`, type: "success" });
      setSaveName("");
    } else {
      showToast({ message: "Error al guardar", type: "error" });
    }
  };

  const handleLoad = (item: SavedJson) => {
    loadSavedJson(item.id);
    showToast({ message: `"${item.name}" cargado`, type: "success" });
  };

  const handleLoadToEdit = (item: SavedJson) => {
    loadSavedJson(item.id, "edit");
    showToast({ message: `"${item.name}" abierto en Edit`, type: "success" });
  };

  const handleDelete = (item: SavedJson) => {
    deleteSavedJson(item.id);
    showToast({ message: `"${item.name}" eliminado`, type: "info" });
  };

  const handleStartRename = (item: SavedJson) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleRename = (item: SavedJson) => {
    if (editName.trim()) {
      renameSavedJson(item.id, editName.trim());
      showToast({ message: "Nombre actualizado", type: "success" });
    }
    setEditingId(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className={styles.savedView}>
      {/* Saved list */}
      <section className={styles.listSection}>
        <h3>JSONs guardados</h3>
        {savedJsons.length === 0 ? (
          <p className={styles.emptyMessage}>No hay JSONs guardados</p>
        ) : (
          <ul className={styles.list}>
            {savedJsons
              .slice()
              .sort((a, b) => b.updatedAt - a.updatedAt)
              .map((item) => (
                <li key={item.id} className={styles.item}>
                  <div className={styles.itemInfo}>
                    {editingId === item.id ? (
                      <input
                        type="text"
                        className={styles.renameInput}
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(item);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        onBlur={() => handleRename(item)}
                        autoFocus
                      />
                    ) : (
                      <span
                        className={styles.itemName}
                        onDoubleClick={() => handleStartRename(item)}
                        title="Doble clic para renombrar"
                      >
                        {item.name}
                      </span>
                    )}
                    <span className={styles.itemMeta}>
                      {formatSize(item.size)} · {formatDate(item.updatedAt)}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleLoad(item)}
                      title="Cargar en Tree View"
                    >
                      📂
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleLoadToEdit(item)}
                      title="Abrir en Edit Mode"
                    >
                      ✍️
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleStartRename(item)}
                      title="Renombrar"
                    >
                      ✏️
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(item)}
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Save current JSON - sticky footer */}
      <section className={styles.saveSection}>
        <h3>Guardar JSON actual</h3>
        <div className={styles.saveForm}>
          <input
            type="text"
            className={styles.input}
            placeholder="Nombre del guardado..."
            value={saveName}
            onChange={(e) => setSaveName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            disabled={!rawJson}
          />
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={!canSave}
            title={
              isOverSize
                ? `El JSON excede el límite de ${MAX_SIZE_KB}KB`
                : savedJsons.length >= 10
                ? "Límite de 10 guardados alcanzado"
                : undefined
            }
          >
            💾 Guardar
          </button>
        </div>
        <div className={styles.saveInfo}>
          {rawJson && (
            <span className={styles.sizeInfo}>
              Tamaño: {formatSize(currentSize)}
              {isOverSize && (
                <span className={styles.sizeWarning}>
                  {" "}(máx: {MAX_SIZE_KB}KB)
                </span>
              )}
            </span>
          )}
          <span className={styles.limitInfo}>
            {savedJsons.length}/10 guardados
          </span>
        </div>
      </section>
    </div>
  );
}
