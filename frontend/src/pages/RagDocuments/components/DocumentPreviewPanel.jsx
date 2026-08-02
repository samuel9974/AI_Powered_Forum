import { ExternalLink } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchPdfObjectUrl } from '../../../services/rag/fetch-document-pdf.js';
import styles from '../RagDocuments.module.css';

/** Chrome/Edge PDF viewer: fit page width so the full page is visible. */
const PDF_VIEWER_PARAMS = '#toolbar=1&navpanes=0&scrollbar=1&view=FitH';

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

  const previewSrc = pdfUrl ? `${pdfUrl}${PDF_VIEWER_PARAMS}` : null;

  return (
    <div className={styles.ragDocuments__readerFrame}>
      <div className={styles.ragDocuments__readerToolbar}>
        <p className={styles.ragDocuments__readerToolbarLabel}>
          Document preview · fitted to width
        </p>
        {previewSrc ? (
          <a
            className={styles.ragDocuments__readerOpenLink}
            href={pdfUrl}
            target='_blank'
            rel='noopener noreferrer'
          >
            <ExternalLink size={14} aria-hidden />
            Open full size
          </a>
        ) : null}
      </div>

      {isLoading ? (
        <p className={styles.ragDocuments__readerLoading}>
          Loading document preview…
        </p>
      ) : null}
      {error ? (
        <p className={styles.ragDocuments__inlineError} role='alert'>
          {error}
        </p>
      ) : null}
      {!isLoading && !error && previewSrc ? (
        <div className={styles.ragDocuments__previewStage}>
          <iframe
            className={styles.ragDocuments__previewFrame}
            src={previewSrc}
            title={`PDF preview: ${title}`}
          />
        </div>
      ) : null}
    </div>
  );
}
