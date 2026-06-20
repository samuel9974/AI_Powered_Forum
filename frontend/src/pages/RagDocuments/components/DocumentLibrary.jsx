import { FileText, Loader2, Upload } from 'lucide-react';
import { formatFileSize } from '../utils/rag-documents.utils.js';
import DocumentListItem from './DocumentListItem.jsx';
import styles from '../RagDocuments.module.css';

export default function DocumentLibrary({
  fileInputRef,
  documents,
  activeDocument,
  selectedFile,
  isLoading,
  isUploading,
  uploadError,
  deletingDocumentId,
  onChooseFileClick,
  onFileChange,
  onUploadClick,
  onSelectDocument,
  onDeleteDocument,
}) {
  return (
    <aside className={styles.ragDocuments__library} aria-label='Document library'>
      <header className={styles.ragDocuments__libraryHeader}>
        <h2 className={styles.ragDocuments__libraryTitle}>Library</h2>
        <p className={styles.ragDocuments__libraryHint}>
          Add PDFs here. Processing runs once per upload.
        </p>
      </header>

      <div className={styles.ragDocuments__uploadZone}>
        <p className={styles.ragDocuments__uploadHint}>
          Accepted format: PDF. Maximum file size is enforced by the server.
        </p>
        <input
          ref={fileInputRef}
          type='file'
          accept='application/pdf,.pdf'
          className={styles.ragDocuments__fileInput}
          onChange={onFileChange}
          aria-hidden
          tabIndex={-1}
        />
        <div className={styles.ragDocuments__uploadActions}>
          <button
            type='button'
            className={styles.ragDocuments__chooseBtn}
            onClick={onChooseFileClick}
            disabled={isUploading}
          >
            <FileText size={16} strokeWidth={2} aria-hidden />
            Choose file
          </button>
          <button
            type='button'
            className={styles.ragDocuments__uploadBtn}
            onClick={onUploadClick}
            disabled={isUploading || !selectedFile}
            aria-live='polite'
          >
            {isUploading ? (
              <>
                <Loader2
                  size={16}
                  strokeWidth={2.25}
                  className={styles.ragDocuments__spin}
                  aria-hidden
                />
                Uploading…
              </>
            ) : (
              <>
                <Upload size={16} strokeWidth={2.25} aria-hidden />
                Upload
              </>
            )}
          </button>
        </div>
        <p className={styles.ragDocuments__fileSelection}>
          {selectedFile
            ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
            : 'No file selected.'}
        </p>
        {uploadError ? (
          <p className={styles.ragDocuments__uploadError} role='alert'>
            {uploadError}
          </p>
        ) : null}
      </div>

      <div className={styles.ragDocuments__listBody}>
        {isLoading ? (
          <p className={styles.ragDocuments__listLoading}>Loading your library…</p>
        ) : documents.length === 0 ? (
          <p className={styles.ragDocuments__listEmpty}>
            Your library is empty. Upload a PDF to index it for search and Q&amp;A.
          </p>
        ) : (
          <ul className={styles.ragDocuments__list}>
            {documents.map(document => (
              <DocumentListItem
                key={document.documentId}
                document={document}
                isActive={activeDocument?.documentId === document.documentId}
                onSelect={onSelectDocument}
                onDelete={onDeleteDocument}
                isDeleting={deletingDocumentId === document.documentId}
              />
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
