import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { timeAgo } from '../../lib/utils.js';
import styles from './QuestionCard.module.css';

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

function getAvatarPalette(author, isOwn) {
  if (isOwn) {
    return { background: 'var(--primary)', color: '#ffffff' };
  }

  const key = String(author?.id ?? getAuthorName(author));
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = key.charCodeAt(i) + (hash * 31 - hash);
  }

  return AVATAR_PALETTES[Math.abs(hash) % AVATAR_PALETTES.length];
}

function truncateContent(content, maxLength = 160) {
  if (!content) return '';
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength).trimEnd()}…`;
}

/**
 * Clickable feed row for a single question thread.
 */
export default function QuestionCard({ question, isOwn = false }) {
  const navigate = useNavigate();

  if (!question) return null;

  const replyCount = question.answerCount ?? 0;
  const replyLabel = `${replyCount} replies`;
  const authorLabel = isOwn ? 'by You' : `by ${getAuthorName(question.author)}`;
  const avatarPalette = getAvatarPalette(question.author, isOwn);

  const handleClick = () => {
    if (question.questionHash) {
      navigate(`/questions/${question.questionHash}`);
    }
  };

  const handleKeyDown = event => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className={`${styles.questionCard} ${
        isOwn ? styles['questionCard--own'] : ''
      }`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role='button'
      tabIndex={0}
      aria-label={`Open question: ${question.title}`}
    >
      {isOwn ? (
        <span className={styles.questionCard__badge}>YOURS</span>
      ) : null}

      <div
        className={styles.questionCard__avatar}
        style={{
          backgroundColor: avatarPalette.background,
          color: avatarPalette.color,
        }}
        aria-hidden
      >
        {getInitials(question.author)}
      </div>

      <div className={styles.questionCard__body}>
        <h3 className={styles.questionCard__title}>{question.title}</h3>

        {question.content ? (
          <p className={styles.questionCard__snippet}>
            {truncateContent(question.content)}
          </p>
        ) : null}

        <p className={styles.questionCard__meta}>
          <span className={styles.questionCard__metaItem}>
            <MessageSquare
              size={13}
              strokeWidth={2}
              className={styles.questionCard__metaIcon}
              aria-hidden
            />
            {replyLabel}
          </span>
          <span className={styles.questionCard__metaDot} aria-hidden>
            ·
          </span>
          <span className={styles.questionCard__metaItem}>
            {timeAgo(question.createdAt)}
          </span>
          <span className={styles.questionCard__metaDot} aria-hidden>
            ·
          </span>
          <span className={styles.questionCard__metaItem}>{authorLabel}</span>
        </p>
      </div>
    </article>
  );
}
