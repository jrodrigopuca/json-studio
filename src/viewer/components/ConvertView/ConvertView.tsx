/**
 * ConvertView component - Convert JSON to TypeScript or XML.
 */

import { useState, useMemo } from 'react';
import { useStore } from '../../store';
import { useI18n } from '../../hooks/useI18n';
import { convertJson, CONVERT_FORMATS, type ConvertFormat } from '../../core/converters';
import { useToast } from '../Toast';
import { Icon } from '../Icon';
import styles from './ConvertView.module.css';

export function ConvertView() {
  const rawJson = useStore((s) => s.rawJson);
  const [format, setFormat] = useState<ConvertFormat>('typescript');
  const { show: showToast } = useToast();
  const { t } = useI18n();

  // Parse JSON and convert
  const { converted, error } = useMemo(() => {
    try {
      const parsed = JSON.parse(rawJson);
      const result = convertJson(parsed, format);
      return { converted: result, error: null };
    } catch (e) {
      return { converted: '', error: (e as Error).message };
    }
  }, [rawJson, format]);

  // Copy to clipboard
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(converted);
      showToast({ message: t('convertView.toast.copiedToClipboard'), type: 'success' });
    } catch {
      showToast({ message: t('convertView.toast.copyError'), type: 'error' });
    }
  };

  // Download file
  const handleDownload = () => {
    const extension = format === 'typescript' ? 'ts' : 'xml';
    const mimeType = format === 'typescript' ? 'text/typescript' : 'application/xml';
    const blob = new Blob([converted], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    showToast({ message: t('convertView.toast.downloadedAs', { ext: extension }), type: 'success' });
  };

  return (
    <div className={styles.container}>
      {/* Left panel: JSON source */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>JSON</span>
        </div>
        <pre className={styles.code}>{rawJson}</pre>
      </div>

      {/* Divider */}
      <div className={styles.divider} />

      {/* Right panel: Converted output */}
      <div className={styles.panel}>
        <div className={styles.panelHeader}>
          <div className={styles.formatSelector}>
            {CONVERT_FORMATS.map(({ id, label }) => (
              <button
                key={id}
                className={`${styles.formatButton} ${format === id ? styles.active : ''}`}
                onClick={() => setFormat(id)}
              >
                {label}
              </button>
            ))}
          </div>
          <div className={styles.actions}>
            <button
              className={styles.actionButton}
              onClick={handleCopy}
              title={t('convertView.tooltip.copyToClipboard')}
              disabled={!!error}
            >
              <Icon name="copy" size={14} />
            </button>
            <button
              className={styles.actionButton}
              onClick={handleDownload}
              title={t('convertView.tooltip.downloadFile')}
              disabled={!!error}
            >
              <Icon name="download" size={14} />
            </button>
          </div>
        </div>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <pre className={styles.code}>{converted}</pre>
        )}
      </div>
    </div>
  );
}
