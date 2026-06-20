/**
 * Knowledge Base (RAG): private PDF library with upload, search, and AI Q&A.
 */
import { useEffect, useRef, useState } from 'react';
import { deleteDocument } from '../../services/rag/delete-document.js';
import { getDocumentMeta } from '../../services/rag/get-document-meta.js';
import { listDocuments } from '../../services/rag/list-documents.js';
import { uploadPdf } from '../../services/rag/upload-document.js';
import ActiveDocumentViewer from './components/ActiveDocumentViewer.jsx';
import DocumentLibrary from './components/DocumentLibrary.jsx';
import { PROCESSING_POLL_INTERVAL_MS } from './constants.js';
import { mergeDocumentUpdate } from './utils/rag-documents.utils.js';
import styles from './RagDocuments.module.css';

export default function RagDocuments() {
  const fileInputRef = useRef(null);

  const [documents, setDocuments] = useState([]);
  const [activeDocument, setActiveDocument] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [listError, setListError] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [deletingDocumentId, setDeletingDocumentId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchDocuments() {
      setIsLoading(true);
      setListError(null);

      try {
        const data = await listDocuments();
        if (!cancelled) {
          setDocuments(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!cancelled) {
          setDocuments([]);
          setListError('Could not load documents.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchDocuments();

    return () => {
      cancelled = true;
    };
  }, []);

  const processingDocumentIds = documents
    .filter(document => document.status === 'processing')
    .map(document => document.documentId);

  useEffect(() => {
    if (processingDocumentIds.length === 0) {
      return undefined;
    }

    let cancelled = false;

    async function pollProcessingDocuments() {
      for (const documentId of processingDocumentIds) {
        if (cancelled) return;

        try {
          const updated = await getDocumentMeta(documentId);
          if (cancelled || !updated) return;

          setDocuments(prev => mergeDocumentUpdate(prev, updated));
          setActiveDocument(prev =>
            prev?.documentId === updated.documentId ? updated : prev,
          );
        } catch {
          // Ignore transient poll failures; the next interval will retry.
        }
      }
    }

    pollProcessingDocuments();
    const intervalId = window.setInterval(
      pollProcessingDocuments,
      PROCESSING_POLL_INTERVAL_MS,
    );

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [processingDocumentIds.join(',')]);

  function handleChooseFileClick() {
    setUploadError(null);
    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      setSelectedFile(null);
      setUploadError('Only PDF files are allowed.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  }

  async function handleUploadClick() {
    if (!selectedFile || isUploading) return;

    setIsUploading(true);
    setUploadError(null);

    try {
      const uploaded = await uploadPdf(selectedFile);
      if (!uploaded) {
        throw new Error('Upload completed but no document was returned.');
      }

      setDocuments(prev => {
        const withoutDuplicate = prev.filter(
          item => item.documentId !== uploaded.documentId,
        );
        return [uploaded, ...withoutDuplicate];
      });
      setActiveDocument(uploaded);
      setSelectedFile(null);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload PDF.');
    } finally {
      setIsUploading(false);
    }
  }

  function handleSelectDocument(document) {
    setActiveDocument(document);
  }

  async function handleDeleteDocument(document) {
    const confirmed = window.confirm(
      `Delete "${document.title}"? This removes the PDF and all indexed chunks.`,
    );
    if (!confirmed) return;

    setDeletingDocumentId(document.documentId);

    try {
      await deleteDocument(document.documentId);
      setDocuments(prev =>
        prev.filter(item => item.documentId !== document.documentId),
      );

      if (activeDocument?.documentId === document.documentId) {
        setActiveDocument(null);
      }
    } catch (err) {
      window.alert(err.message || 'Could not delete document.');
    } finally {
      setDeletingDocumentId(null);
    }
  }

  return (
    <div className={styles.ragDocuments}>
      <section
        className={styles.ragDocuments__hero}
        aria-labelledby='rag-documents-title'
      >
        <div className={styles.ragDocuments__heroCopy}>
          <p className={styles.ragDocuments__kicker}>Knowledge base</p>
          <h1 id='rag-documents-title' className={styles.ragDocuments__title}>
            Private PDF library
          </h1>
          <p className={styles.ragDocuments__lead}>
            Upload study or reference PDFs to your own workspace. Each file is
            indexed for semantic search and optional AI answers that cite passages
            from that document only. File size limits apply on the server; other
            users never see your uploads.
          </p>
        </div>
      </section>

      {listError ? (
        <p className={styles.ragDocuments__pageError} role='alert'>
          {listError}
        </p>
      ) : null}

      <div className={styles.ragDocuments__workspace}>
        <DocumentLibrary
          fileInputRef={fileInputRef}
          documents={documents}
          activeDocument={activeDocument}
          selectedFile={selectedFile}
          isLoading={isLoading}
          isUploading={isUploading}
          uploadError={uploadError}
          deletingDocumentId={deletingDocumentId}
          onChooseFileClick={handleChooseFileClick}
          onFileChange={handleFileChange}
          onUploadClick={handleUploadClick}
          onSelectDocument={handleSelectDocument}
          onDeleteDocument={handleDeleteDocument}
        />

        <section
          className={styles.ragDocuments__viewer}
          aria-label='Active document'
        >
          {activeDocument ? (
            <ActiveDocumentViewer document={activeDocument} />
          ) : (
            <div className={styles.ragDocuments__emptySelection}>
              <p className={styles.ragDocuments__emptyText}>
                Choose a document from the library to open the reader, run semantic
                search over its text, and ask questions with AI-assisted answers
                grounded in that file.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
