/**
 * SavedView component - manage saved JSON documents.
 */

import { useState } from "react";
import { useStore, type SavedJson } from "../../store";
import { useToast } from "../Toast";
import { Icon } from "../Icon";
import { useI18n } from "../../hooks/useI18n";
import { formatSize, formatDate } from "../../core/formatter";
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
  const { t } = useI18n();

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
      showToast({ message: t("savedView.toast.saved", { name: saveName }), type: "success" });
      setSaveName("");
    } else {
      showToast({ message: t("savedView.toast.saveError"), type: "error" });
    }
  };

  const handleLoad = (item: SavedJson) => {
    loadSavedJson(item.id);
    showToast({ message: t("savedView.toast.loaded", { name: item.name }), type: "success" });
  };

  const handleLoadToEdit = (item: SavedJson) => {
    loadSavedJson(item.id, "edit");
    showToast({ message: t("savedView.toast.openedInEdit", { name: item.name }), type: "success" });
  };

  const handleDelete = (item: SavedJson) => {
    deleteSavedJson(item.id);
    showToast({ message: t("savedView.toast.deleted", { name: item.name }), type: "info" });
  };

  const handleStartRename = (item: SavedJson) => {
    setEditingId(item.id);
    setEditName(item.name);
  };

  const handleRename = (item: SavedJson) => {
    if (editName.trim()) {
      renameSavedJson(item.id, editName.trim());
      showToast({ message: t("savedView.toast.nameUpdated"), type: "success" });
    }
    setEditingId(null);
  };

  return (
    <div className={styles.savedView}>
      {/* Saved list */}
      <section className={styles.listSection}>
        <h3>{t("savedView.title")}</h3>
        {savedJsons.length === 0 ? (
          <p className={styles.emptyMessage}>{t("savedView.empty")}</p>
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
                        title={t("savedView.tooltip.doubleClickRename")}
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
                      title={t("savedView.tooltip.loadInTreeView")}
                    >
                      <Icon name="folder" size={14} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleLoadToEdit(item)}
                      title={t("savedView.tooltip.openInEditMode")}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      className={styles.actionButton}
                      onClick={() => handleStartRename(item)}
                      title={t("savedView.tooltip.rename")}
                    >
                      <Icon name="pencil" size={14} />
                    </button>
                    <button
                      className={`${styles.actionButton} ${styles.deleteButton}`}
                      onClick={() => handleDelete(item)}
                      title={t("savedView.tooltip.delete")}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>

      {/* Save current JSON - sticky footer */}
      <section className={styles.saveSection}>
        <h3>{t("savedView.saveTitle")}</h3>
        <div className={styles.saveForm}>
          <input
            type="text"
            className={styles.input}
            placeholder={t("savedView.placeholder.saveName")}
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
                ? t("savedView.tooltip.jsonExceedsLimit", { maxSize: MAX_SIZE_KB })
                : savedJsons.length >= 10
                ? t("savedView.tooltip.savedLimitReached")
                : undefined
            }
          >
            <Icon name="download" size={14} /> {t("savedView.button.save")}
          </button>
        </div>
        <div className={styles.saveInfo}>
          {rawJson && (
            <span className={styles.sizeInfo}>
              {t("savedView.label.size", { size: formatSize(currentSize) })}
              {isOverSize && (
                <span className={styles.sizeWarning}>
                  {" "}{t("savedView.label.sizeWarning", { maxSize: MAX_SIZE_KB })}
                </span>
              )}
            </span>
          )}
          <span className={styles.limitInfo}>
            {t("savedView.label.savedCount", { count: savedJsons.length })}
          </span>
        </div>
      </section>
    </div>
  );
}
