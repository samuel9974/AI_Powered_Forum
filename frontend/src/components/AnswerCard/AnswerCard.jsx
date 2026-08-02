/**
 * Presentational card for a single forum answer.
 * Owner actions (edit/delete) appear only when callbacks are provided.
 * When isEditing is true, children replace the markdown body (inline editor).
 */
import ReactMarkdown from 'react-markdown';
import { isAnswerAuthoredByUser } from '../../lib/utils.js';
import styles from './AnswerCard.module.css';

const AVATAR_PALETTES = [
  { background: '#38bdf8', color: '#ffffff' },
  { background: '#2dd4bf', color: '#ffffff' },
  { background: '#4ade80', color: '#ffffff' },
  { background: '#a78bfa', color: '#ffffff' },
  { background: '#818cf8', color: '#ffffff' },
];

function getInitials(author) {
  const first = author?.firstName?.trim()?.[0] ?? '';
  const last = author?.lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}

function getAuthorName(author) {
  if (!author) return 'Unknown author';
  const name = [author.firstName, author.lastName].filter(Boolean).join(' ');
  return name || 'Unknown author';
}

function getAvatarPalette(author) {
  const key = String(author?.id ?? getAuthorName(author));
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + (hash * 31 - hash);
  }
  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function formatPostedDate(dateInput) {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric',
  });
}

function wasAnswerEdited(answer) {
  if (!answer?.createdAt || !answer?.updatedAt) return false;
  const created = new Date(answer.createdAt).getTime();
  const updated = new Date(answer.updatedAt).getTime();
  if (Number.isNaN(created) || Number.isNaN(updated)) return false;
  return updated !== created;
}

function MarkdownBody({ content }) {
  if (!content) return null;
  return (
    <div className={styles.answerCard__markdown}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function AuthorBadge({ author }) {
  const palette = getAvatarPalette(author);
  return (
    <div
      className={styles.answerCard__avatar}
      style={{ backgroundColor: palette.background, color: palette.color }}
      aria-hidden
    >
      {getInitials(author)}
    </div>
  );
}

/**
 * @param answer - answer object with id, content, createdAt, updatedAt, author
 * @param currentUser - signed-in user from AuthContext
 * @param onEdit - optional callback(answer) when the owner clicks Edit
 * @param onDelete - optional callback(answer) when the owner clicks Delete
 * @param isBusy - disables owner action buttons while a mutation is in flight
 * @param isDeleting - when true, Delete shows a busy label for this card
 * @param isEditing - when true, renders children instead of markdown body
 * @param editButtonRef - optional ref callback for the Edit button (focus restore)
 * @param children - inline editor UI provided by the parent while editing
 */
export default function AnswerCard({
  answer,
  currentUser = null,
  onEdit = null,
  onDelete = null,
  isBusy = false,
  isDeleting = false,
  isEditing = false,
  editButtonRef = null,
  children = null,
}) {
  if (!answer) return null;

  const authorName = getAuthorName(answer.author);
  const isOwner = isAnswerAuthoredByUser(answer, currentUser);
  const showEdit = isOwner && typeof onEdit === 'function' && !isEditing;
  const showDelete = isOwner && typeof onDelete === 'function' && !isEditing;
  const showActions = showEdit || showDelete;
  const edited = wasAnswerEdited(answer);

  const dateParts = [formatPostedDate(answer.createdAt)];
  if (edited) {
    const editedOn = formatPostedDate(answer.updatedAt);
    dateParts.push(editedOn ? `Edited ${editedOn}` : 'Edited');
  }
  if (isEditing) dateParts.push('Editing');

  return (
    <article
      className={styles.answerCard}
      aria-busy={isDeleting || undefined}
    >
      <header className={styles.answerCard__header}>
        <AuthorBadge author={answer.author} />
        <div className={styles.answerCard__authorMeta}>
          <p className={styles.answerCard__author}>{authorName}</p>
          <p className={styles.answerCard__date}>
            {dateParts.filter(Boolean).join(' · ')}
          </p>
        </div>

        {showActions ? (
          <div className={styles.answerCard__actions}>
            {showEdit ? (
              <button
                type='button'
                ref={editButtonRef}
                className={styles.answerCard__actionBtn}
                onClick={() => onEdit(answer)}
                disabled={isBusy}
                aria-label={`Edit your answer`}
              >
                Edit
              </button>
            ) : null}
            {showDelete ? (
              <button
                type='button'
                className={`${styles.answerCard__actionBtn} ${styles['answerCard__actionBtn--danger']}`}
                onClick={() => onDelete(answer)}
                disabled={isBusy}
                aria-label={
                  isDeleting ? 'Deleting your answer' : 'Delete your answer'
                }
                aria-busy={isDeleting || undefined}
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            ) : null}
          </div>
        ) : null}
      </header>

      {isEditing ? children : <MarkdownBody content={answer.content} />}
    </article>
  );
}
