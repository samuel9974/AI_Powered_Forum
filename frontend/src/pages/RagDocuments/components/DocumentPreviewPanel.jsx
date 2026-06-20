import { useEffect, useState } from 'react';
import { fetchPdfObjectUrl } from '../../../services/rag/fetch-document-pdf.js';
import styles from '../RagDocuments.module.css';

export default function DocumentPreviewPanel({ documentId, title }) {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    let objectUrl = null;

    async function loadPdfPreview() {
      setIsLoading(true);
      setError(null);
      setPdfUrl(null);

      try {
        objectUrl = await fetchPdfObjectUrl(documentId);

        if (cancelled) {
          URL.revokeObjectURL(objectUrl);
          return;
        }

        setPdfUrl(objectUrl);
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Failed to load PDF preview.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadPdfPreview();

    return () => {
      cancelled = true;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentId]);

  return (
    <div className={styles.ragDocuments__readerFrame}>
      {isLoading ? (
        <p className={styles.ragDocuments__readerLoading}>Loading document preview…</p>
      ) : null}
      {error ? (
        <p className={styles.ragDocuments__inlineError} role='alert'>
          {error}
        </p>
      ) : null}
      {!isLoading && !error && pdfUrl ? (
        <iframe
          className={styles.ragDocuments__previewFrame}
          src={pdfUrl}
          title={`PDF preview: ${title}`}
        />
      ) : null}
    </div>
  );
}
