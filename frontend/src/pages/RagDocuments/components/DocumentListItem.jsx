import { Loader2, Trash2 } from 'lucide-react';
import { getStatusLabel } from '../utils/rag-documents.utils.js';
import styles from '../RagDocuments.module.css';

export default function DocumentListItem({
  document,
  isActive,
  onSelect,
  onDelete,
  isDeleting,
}) {
  return (
    <li
      className={`${styles.ragDocuments__docCard} ${
        isActive ? styles['ragDocuments__docCard--active'] : ''
      }`}
    >
      <button
        type='button'
        className={styles.ragDocuments__docCardMain}
        onClick={() => onSelect(document)}
        aria-current={isActive ? 'true' : undefined}
      >
        <span className={styles.ragDocuments__docCardTitle}>{document.title}</span>
        <span
          className={`${styles.ragDocuments__status} ${styles[`ragDocuments__status--${document.status}`] ?? ''}`}
        >
          {getStatusLabel(document.status)}
        </span>
      </button>
      <button
        type='button'
        className={styles.ragDocuments__docCardDelete}
        onClick={() => onDelete(document)}
        disabled={isDeleting}
        aria-label={`Delete ${document.title}`}
      >
        {isDeleting ? (
          <Loader2 size={16} className={styles.ragDocuments__spin} aria-hidden />
        ) : (
          <Trash2 size={16} strokeWidth={2} aria-hidden />
        )}
      </button>
    </li>
  );
}
