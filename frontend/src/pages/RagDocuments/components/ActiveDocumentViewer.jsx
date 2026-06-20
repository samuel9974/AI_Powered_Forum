import DocumentAskPanel from './DocumentAskPanel.jsx';
import DocumentPreviewPanel from './DocumentPreviewPanel.jsx';
import DocumentSearchPanel from './DocumentSearchPanel.jsx';
import styles from '../RagDocuments.module.css';

export default function ActiveDocumentViewer({ document }) {
  if (document.status === 'processing' || document.status === 'failed') {
    return (
      <div className={styles.ragDocuments__pendingPanel}>
        <p className={styles.ragDocuments__pendingText}>
          {document.status === 'failed' ? (
            <>
              This document is not ready for preview or AI tools.{' '}
              {document.errorMessage
                ? document.errorMessage
                : 'Processing failed. Delete it and upload again.'}
            </>
          ) : (
            <>
              This document is not ready for preview or AI tools. Current status:{' '}
              <strong>{document.status}</strong>.
            </>
          )}
        </p>
      </div>
    );
  }

  if (document.status !== 'ready') {
    return (
      <div className={styles.ragDocuments__pendingPanel}>
        <p className={styles.ragDocuments__pendingText}>
          This document is not ready for preview or AI tools.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.ragDocuments__viewerStack}>
      <section className={styles.ragDocuments__section} aria-labelledby='rag-reader-heading'>
        <header className={styles.ragDocuments__sectionHeader}>
          <h3 id='rag-reader-heading' className={styles.ragDocuments__sectionTitle}>
            Reader
          </h3>
          <p className={styles.ragDocuments__sectionHint}>
            Inline preview of the selected PDF.
          </p>
        </header>
        <DocumentPreviewPanel
          documentId={document.documentId}
          title={document.title}
        />
      </section>

      <DocumentSearchPanel documentId={document.documentId} />
      <DocumentAskPanel documentId={document.documentId} />
    </div>
  );
}
