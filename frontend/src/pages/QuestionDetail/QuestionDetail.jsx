/**
 * Question Detail: full thread view, answers, related questions, and AI answer fit.
 */
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Bold,
  Code2,
  Italic,
  Link2,
  MessageSquare,
  Share2,
  Wand2,
} from 'lucide-react';
import AnswerCard from '../../components/AnswerCard/AnswerCard.jsx';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { ANSWER_MIN, isAuthoredByUser } from '../../lib/utils.js';
import { answerService } from '../../services/answer/answer.service.js';
import { questionService } from '../../services/question/question.service.js';
import ui from '../../styles/pageStates.module.css';
import styles from './QuestionDetail.module.css';

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

function wrapSelection(textarea, before, after = before) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const value = textarea.value;
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  const cursor = start + before.length + selected.length + after.length;
  return { next, cursor };
}

function MarkdownBody({ content, className }) {
  if (!content) return null;
  return (
    <div className={className}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}

function AuthorBadge({ author }) {
  const palette = getAvatarPalette(author);
  return (
    <div
      className={styles.questionDetail__avatar}
      style={{ backgroundColor: palette.background, color: palette.color }}
      aria-hidden
    >
      {getInitials(author)}
    </div>
  );
}

function RelatedQuestionCard({ item }) {
  return (
    <Link
      to={`/questions/${item.questionHash}`}
      className={styles.questionDetail__relatedCard}
    >
      <p className={styles.questionDetail__relatedTitle}>{item.title}</p>
      <p className={styles.questionDetail__relatedMeta}>
        {getAuthorName(item.author)} · {formatPostedDate(item.createdAt)}
      </p>
    </Link>
  );
}

export default function QuestionDetail() {
  const { questionHash } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const answerRef = useRef(null);
  const editRef = useRef(null);
  const editButtonRefs = useRef(new Map());

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [similarQuestions, setSimilarQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [answerText, setAnswerText] = useState('');
  const [answerError, setAnswerError] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingFit, setIsCheckingFit] = useState(false);
  const [fitResult, setFitResult] = useState(null);
  const [fitError, setFitError] = useState(null);
  const [shareMessage, setShareMessage] = useState(null);

  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editText, setEditText] = useState('');
  const [editError, setEditError] = useState(null);
  const [editSubmitError, setEditSubmitError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCheckingEditFit, setIsCheckingEditFit] = useState(false);
  const [editFitResult, setEditFitResult] = useState(null);
  const [editFitError, setEditFitError] = useState(null);
  const [deletingAnswerId, setDeletingAnswerId] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const [answerToDelete, setAnswerToDelete] = useState(null);
  const [focusReturnAnswerId, setFocusReturnAnswerId] = useState(null);

  const isOwnQuestion = isAuthoredByUser(question, user);
  const isComposeBusy = isSubmitting || isCheckingFit;
  const isEditBusy = isUpdating || isCheckingEditFit;
  const isDeleting = deletingAnswerId != null;
  const isDeleteModalOpen = answerToDelete != null;
  const isBusy =
    isComposeBusy || isEditBusy || isDeleting || isDeleteModalOpen;
  const answerCount = answers.length;
  const sortedAnswers = [...answers].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  useEffect(() => {
    let cancelled = false;

    async function fetchThread() {
      if (!questionHash) {
        setLoadError('Question not found.');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setLoadError(null);

      try {
        const [thread, related] = await Promise.all([
          questionService.getSingleQuestion(questionHash),
          questionService.getSimilarQuestions(questionHash).catch(() => []),
        ]);

        if (!cancelled) {
          setQuestion(thread.question);
          setAnswers(Array.isArray(thread.answers) ? thread.answers : []);
          setSimilarQuestions(Array.isArray(related) ? related : []);
          setEditingAnswerId(null);
          setEditText('');
          setEditError(null);
          setEditSubmitError(null);
          setEditFitResult(null);
          setEditFitError(null);
          setDeleteError(null);
          setAnswerToDelete(null);
        }
      } catch (err) {
        if (!cancelled) {
          setQuestion(null);
          setAnswers([]);
          setSimilarQuestions([]);
          setEditingAnswerId(null);
          setDeleteError(null);
          setAnswerToDelete(null);
          setLoadError(err.message || 'Failed to load question details.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchThread();

    return () => {
      cancelled = true;
    };
  }, [questionHash]);

  useEffect(() => {
    if (editingAnswerId == null) return;
    const frame = requestAnimationFrame(() => {
      editRef.current?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [editingAnswerId]);

  useEffect(() => {
    if (focusReturnAnswerId == null) return;
    const frame = requestAnimationFrame(() => {
      editButtonRefs.current.get(focusReturnAnswerId)?.focus();
      setFocusReturnAnswerId(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusReturnAnswerId]);

  const applyMarkdown = (textareaRef, setText, onApplied) => type => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    let result;
    if (type === 'bold') result = wrapSelection(textarea, '**');
    else if (type === 'italic') result = wrapSelection(textarea, '*');
    else if (type === 'code') result = wrapSelection(textarea, '`');
    else if (type === 'link') result = wrapSelection(textarea, '[', '](url)');

    if (!result) return;

    setText(result.next);
    onApplied?.();
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const applyComposeMarkdown = applyMarkdown(answerRef, setAnswerText, () => {
    setAnswerError(null);
    setSubmitError(null);
    setFitResult(null);
  });

  const applyEditMarkdown = applyMarkdown(editRef, setEditText, () => {
    setEditError(null);
    setEditSubmitError(null);
    setEditFitResult(null);
  });

  const validateAnswerContent = text => {
    const trimmed = text.trim();
    if (!trimmed) {
      return 'Answer content is required';
    }
    if (trimmed.length < ANSWER_MIN) {
      return `Answer content must be at least ${ANSWER_MIN} characters`;
    }
    return null;
  };

  const resetEditState = () => {
    setEditingAnswerId(null);
    setEditText('');
    setEditError(null);
    setEditSubmitError(null);
    setEditFitResult(null);
    setEditFitError(null);
  };

  const focusEditButton = answerId => {
    if (answerId == null) return;
    setFocusReturnAnswerId(answerId);
  };

  const handleStartEdit = answer => {
    if (!answer || isBusy) return;
    setDeleteError(null);
    setEditingAnswerId(answer.id);
    setEditText(answer.content ?? '');
    setEditError(null);
    setEditSubmitError(null);
    setEditFitResult(null);
    setEditFitError(null);
  };

  const handleCancelEdit = () => {
    if (isEditBusy) return;
    const answerId = editingAnswerId;
    resetEditState();
    focusEditButton(answerId);
  };

  const handleCheckFit = async () => {
    const validationMessage = validateAnswerContent(answerText);
    if (validationMessage) {
      setAnswerError(validationMessage);
      return;
    }

    setIsCheckingFit(true);
    setFitError(null);
    setFitResult(null);

    try {
      const result = await questionService.assessAnswerFit(
        questionHash,
        answerText.trim(),
      );
      setFitResult(result);
    } catch (err) {
      setFitError(err.message || 'Answer fit check is temporarily unavailable.');
    } finally {
      setIsCheckingFit(false);
    }
  };

  const handleCheckEditFit = async () => {
    const validationMessage = validateAnswerContent(editText);
    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    setIsCheckingEditFit(true);
    setEditFitError(null);
    setEditFitResult(null);

    try {
      const result = await questionService.assessAnswerFit(
        questionHash,
        editText.trim(),
      );
      setEditFitResult(result);
    } catch (err) {
      setEditFitError(
        err.message || 'Answer fit check is temporarily unavailable.',
      );
    } finally {
      setIsCheckingEditFit(false);
    }
  };

  const handleSubmitAnswer = async event => {
    event.preventDefault();
    setSubmitError(null);

    const validationMessage = validateAnswerContent(answerText);
    if (validationMessage) {
      setAnswerError(validationMessage);
      return;
    }

    setAnswerError(null);
    setIsSubmitting(true);

    try {
      const created = await answerService.postAnswer({
        questionId: question.id,
        content: answerText.trim(),
      });

      if (created) {
        setAnswers(prev => [...prev, created]);
        setQuestion(prev =>
          prev
            ? { ...prev, answerCount: (prev.answerCount ?? answerCount) + 1 }
            : prev,
        );
      }

      setAnswerText('');
      setFitResult(null);
      setFitError(null);
      setDeleteError(null);
    } catch (err) {
      setSubmitError(err.message || 'Failed to post answer. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async event => {
    event.preventDefault();
    if (!editingAnswerId) return;

    setEditSubmitError(null);

    const validationMessage = validateAnswerContent(editText);
    if (validationMessage) {
      setEditError(validationMessage);
      return;
    }

    setEditError(null);
    setIsUpdating(true);

    try {
      const updated = await answerService.updateAnswer(editingAnswerId, {
        content: editText.trim(),
      });

      if (updated) {
        setAnswers(prev =>
          prev.map(item => (item.id === updated.id ? updated : item)),
        );
      }

      const answerId = editingAnswerId;
      resetEditState();
      focusEditButton(answerId);
    } catch (err) {
      setEditSubmitError(
        err.message || 'Failed to update answer. Please try again.',
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRequestDelete = answer => {
    if (!answer || isBusy) return;
    setDeleteError(null);
    setAnswerToDelete(answer);
  };

  const handleCancelDelete = () => {
    if (isDeleting) return;
    setAnswerToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!answerToDelete || isDeleting) return;

    const answer = answerToDelete;
    setDeleteError(null);
    setDeletingAnswerId(answer.id);

    try {
      await answerService.deleteAnswer(answer.id);

      setAnswers(prev => prev.filter(item => item.id !== answer.id));
      setQuestion(prev =>
        prev
          ? {
              ...prev,
              answerCount: Math.max(
                0,
                (prev.answerCount ?? answerCount) - 1,
              ),
            }
          : prev,
      );

      if (editingAnswerId === answer.id) {
        resetEditState();
      }

      setAnswerToDelete(null);
    } catch (err) {
      setDeleteError(
        err.message || 'Failed to delete answer. Please try again.',
      );
      setAnswerToDelete(null);
    } finally {
      setDeletingAnswerId(null);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setShareMessage('Link copied to clipboard.');
      setTimeout(() => setShareMessage(null), 2500);
    } catch {
      setShareMessage('Could not copy link.');
      setTimeout(() => setShareMessage(null), 2500);
    }
  };

  if (isLoading) {
    return (
      <div
        className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}
      >
        Loading question details…
      </div>
    );
  }

  if (loadError || !question) {
    return (
      <div className={styles.questionDetail__errorState}>
        <p className={styles.questionDetail__errorText} role='alert'>
          {loadError || 'Failed to load question details.'}
        </p>
        <button
          type='button'
          className={styles.questionDetail__errorBtn}
          onClick={() => navigate('/dashboard')}
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className={styles.questionDetail}>
      <Link to='/dashboard' className={styles.questionDetail__back}>
        <ArrowLeft size={16} strokeWidth={2} aria-hidden />
        Back to feed
      </Link>

      <div className={styles.questionDetail__layout}>
        <div className={styles.questionDetail__main}>
          <article className={styles.questionDetail__questionCard}>
            <header className={styles.questionDetail__questionHeader}>
              <AuthorBadge author={question.author} />
              <div>
                <p className={styles.questionDetail__questionAuthor}>
                  {getAuthorName(question.author)}
                </p>
                <p className={styles.questionDetail__questionDate}>
                  Posted {formatPostedDate(question.createdAt)}
                </p>
              </div>
            </header>

            <h1 className={styles.questionDetail__questionTitle}>
              {question.title}
            </h1>

            <MarkdownBody
              content={question.content}
              className={styles.questionDetail__markdown}
            />

            <footer className={styles.questionDetail__questionFooter}>
              <button
                type='button'
                className={styles.questionDetail__chipBtn}
                onClick={handleShare}
              >
                <Share2 size={14} strokeWidth={2} aria-hidden />
                Share
              </button>
              <span className={styles.questionDetail__chipBtn}>
                <MessageSquare size={14} strokeWidth={2} aria-hidden />
                {answerCount} Answer{answerCount === 1 ? '' : 's'}
              </span>
              {shareMessage ? (
                <span className={styles.questionDetail__shareNote}>
                  {shareMessage}
                </span>
              ) : null}
            </footer>
          </article>

          <section
            className={styles.questionDetail__answersSection}
            aria-labelledby='community-answers'
          >
            <h2 id='community-answers' className={styles.questionDetail__sectionTitle}>
              Community Answers ({answerCount})
            </h2>

            {deleteError ? (
              <div className={styles.questionDetail__alert} role='alert'>
                <span>{deleteError}</span>
                <button
                  type='button'
                  className={styles.questionDetail__alertDismiss}
                  onClick={() => setDeleteError(null)}
                  aria-label='Dismiss delete error'
                >
                  Dismiss
                </button>
              </div>
            ) : null}

            {answerCount === 0 ? (
              <div className={styles.questionDetail__emptyAnswers}>
                <MessageSquare
                  size={28}
                  strokeWidth={1.75}
                  className={styles.questionDetail__emptyIcon}
                  aria-hidden
                />
                <p className={styles.questionDetail__emptyTitle}>
                  Be the first to help!
                </p>
                <p className={styles.questionDetail__emptyText}>
                  This question is waiting for an expert like you. Share your
                  knowledge and earn reputation points.
                </p>
              </div>
            ) : (
              <div className={styles.questionDetail__answerList}>
                {sortedAnswers.map(answer => {
                  const isEditing = editingAnswerId === answer.id;

                  return (
                    <AnswerCard
                      key={answer.id}
                      answer={answer}
                      currentUser={user}
                      onEdit={handleStartEdit}
                      onDelete={handleRequestDelete}
                      isBusy={isBusy}
                      isDeleting={deletingAnswerId === answer.id}
                      isEditing={isEditing}
                      editButtonRef={node => {
                        if (node) {
                          editButtonRefs.current.set(answer.id, node);
                        } else {
                          editButtonRefs.current.delete(answer.id);
                        }
                      }}
                    >
                      {isEditing ? (
                        <form onSubmit={handleSaveEdit} noValidate>
                          {editSubmitError ? (
                            <div
                              className={styles.questionDetail__alert}
                              role='alert'
                            >
                              {editSubmitError}
                            </div>
                          ) : null}

                          <div
                            className={`${styles.questionDetail__editor} ${
                              editError
                                ? styles['questionDetail__editor--error']
                                : ''
                            }`}
                          >
                            <div className={styles.questionDetail__toolbar}>
                              <div className={styles.questionDetail__toolbarGroup}>
                                <button
                                  type='button'
                                  className={styles.questionDetail__toolbarBtn}
                                  onClick={() => applyEditMarkdown('bold')}
                                  disabled={isEditBusy}
                                  aria-label='Bold'
                                >
                                  <Bold size={15} strokeWidth={2.25} aria-hidden />
                                </button>
                                <button
                                  type='button'
                                  className={styles.questionDetail__toolbarBtn}
                                  onClick={() => applyEditMarkdown('italic')}
                                  disabled={isEditBusy}
                                  aria-label='Italic'
                                >
                                  <Italic
                                    size={15}
                                    strokeWidth={2.25}
                                    aria-hidden
                                  />
                                </button>
                                <button
                                  type='button'
                                  className={styles.questionDetail__toolbarBtn}
                                  onClick={() => applyEditMarkdown('code')}
                                  disabled={isEditBusy}
                                  aria-label='Inline code'
                                >
                                  <Code2
                                    size={15}
                                    strokeWidth={2.25}
                                    aria-hidden
                                  />
                                </button>
                                <button
                                  type='button'
                                  className={styles.questionDetail__toolbarBtn}
                                  onClick={() => applyEditMarkdown('link')}
                                  disabled={isEditBusy}
                                  aria-label='Link'
                                >
                                  <Link2
                                    size={15}
                                    strokeWidth={2.25}
                                    aria-hidden
                                  />
                                </button>
                              </div>
                              <span className={styles.questionDetail__charCount}>
                                {editText.length} character
                                {editText.length === 1 ? '' : 's'}
                              </span>
                            </div>
                            <textarea
                              ref={editRef}
                              className={styles.questionDetail__textarea}
                              placeholder='Update your answer… Markdown is supported.'
                              value={editText}
                              onChange={event => {
                                setEditText(event.target.value);
                                setEditError(null);
                                setEditSubmitError(null);
                                setEditFitResult(null);
                              }}
                              disabled={isEditBusy}
                              rows={8}
                              aria-invalid={Boolean(editError)}
                            />
                          </div>

                          {editError ? (
                            <p
                              className={styles.questionDetail__fieldError}
                              role='alert'
                            >
                              {editError}
                            </p>
                          ) : null}

                          <div className={styles.questionDetail__coachRow}>
                            <button
                              type='button'
                              className={styles.questionDetail__coachBtn}
                              onClick={handleCheckEditFit}
                              disabled={isEditBusy}
                            >
                              <Wand2 size={14} strokeWidth={2} aria-hidden />
                              {isCheckingEditFit
                                ? 'Checking fit…'
                                : 'Check draft fit'}
                            </button>
                            <span className={styles.questionDetail__coachNote}>
                              Relevance only. Not grading correctness. You need
                              at least {ANSWER_MIN} characters.
                            </span>
                          </div>

                          {editFitError ? (
                            <div
                              className={styles.questionDetail__fitError}
                              role='alert'
                            >
                              {editFitError}
                            </div>
                          ) : null}

                          {editFitResult ? (
                            <div
                              className={`${styles.questionDetail__fitPanel} ${
                                styles[
                                  `questionDetail__fitPanel--${editFitResult.level}`
                                ]
                              }`}
                              aria-live='polite'
                            >
                              <p className={styles.questionDetail__fitLevel}>
                                Fit: {editFitResult.level}
                              </p>
                              <p className={styles.questionDetail__fitNote}>
                                {editFitResult.note}
                              </p>
                            </div>
                          ) : null}

                          <div className={styles.questionDetail__actions}>
                            <button
                              type='button'
                              className={styles.questionDetail__cancelBtn}
                              onClick={handleCancelEdit}
                              disabled={isEditBusy}
                              aria-label='Cancel editing answer'
                            >
                              Cancel
                            </button>
                            <button
                              type='submit'
                              className={styles.questionDetail__submitBtn}
                              disabled={isEditBusy}
                              aria-label={
                                isUpdating
                                  ? 'Saving answer changes'
                                  : 'Save answer changes'
                              }
                            >
                              {isUpdating ? 'Saving…' : 'Save changes'}
                            </button>
                          </div>
                        </form>
                      ) : null}
                    </AnswerCard>
                  );
                })}
              </div>
            )}
          </section>

          {isOwnQuestion ? (
            <div className={styles.questionDetail__ownNote}>
              You authored this thread. You cannot post an answer to your own
              question. Wait for a peer to reply.
            </div>
          ) : (
            <section
              className={styles.questionDetail__compose}
              aria-labelledby='contribute-answer'
            >
              <h2 id='contribute-answer' className={styles.questionDetail__sectionTitle}>
                Contribute an answer
              </h2>

              <form onSubmit={handleSubmitAnswer} noValidate>
                {submitError ? (
                  <div className={styles.questionDetail__alert} role='alert'>
                    {submitError}
                  </div>
                ) : null}

                <div
                  className={`${styles.questionDetail__editor} ${
                    answerError ? styles['questionDetail__editor--error'] : ''
                  }`}
                >
                  <div className={styles.questionDetail__toolbar}>
                    <div className={styles.questionDetail__toolbarGroup}>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyComposeMarkdown('bold')}
                        disabled={isComposeBusy || Boolean(editingAnswerId)}
                        aria-label='Bold'
                      >
                        <Bold size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyComposeMarkdown('italic')}
                        disabled={isComposeBusy || Boolean(editingAnswerId)}
                        aria-label='Italic'
                      >
                        <Italic size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyComposeMarkdown('code')}
                        disabled={isComposeBusy || Boolean(editingAnswerId)}
                        aria-label='Inline code'
                      >
                        <Code2 size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyComposeMarkdown('link')}
                        disabled={isComposeBusy || Boolean(editingAnswerId)}
                        aria-label='Link'
                      >
                        <Link2 size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                    </div>
                    <span className={styles.questionDetail__charCount}>
                      {answerText.length} character
                      {answerText.length === 1 ? '' : 's'}
                    </span>
                  </div>
                  <textarea
                    ref={answerRef}
                    className={styles.questionDetail__textarea}
                    placeholder='Type your answer here… You can use Markdown to format your code!'
                    value={answerText}
                    onChange={event => {
                      setAnswerText(event.target.value);
                      setAnswerError(null);
                      setSubmitError(null);
                      setFitResult(null);
                    }}
                    disabled={isComposeBusy || Boolean(editingAnswerId)}
                    rows={8}
                    aria-invalid={Boolean(answerError)}
                  />
                </div>

                {answerError ? (
                  <p className={styles.questionDetail__fieldError} role='alert'>
                    {answerError}
                  </p>
                ) : null}

                <div className={styles.questionDetail__coachRow}>
                  <button
                    type='button'
                    className={styles.questionDetail__coachBtn}
                    onClick={handleCheckFit}
                    disabled={isComposeBusy || Boolean(editingAnswerId)}
                  >
                    <Wand2 size={14} strokeWidth={2} aria-hidden />
                    {isCheckingFit ? 'Checking fit…' : 'Check draft fit'}
                  </button>
                  <span className={styles.questionDetail__coachNote}>
                    Relevance only. Not grading correctness. You need at least{' '}
                    {ANSWER_MIN} characters.
                  </span>
                </div>

                {fitError ? (
                  <div className={styles.questionDetail__fitError} role='alert'>
                    {fitError}
                  </div>
                ) : null}

                {fitResult ? (
                  <div
                    className={`${styles.questionDetail__fitPanel} ${
                      styles[`questionDetail__fitPanel--${fitResult.level}`]
                    }`}
                    aria-live='polite'
                  >
                    <p className={styles.questionDetail__fitLevel}>
                      Fit: {fitResult.level}
                    </p>
                    <p className={styles.questionDetail__fitNote}>{fitResult.note}</p>
                  </div>
                ) : null}

                <div className={styles.questionDetail__actions}>
                  <button
                    type='submit'
                    className={styles.questionDetail__submitBtn}
                    disabled={isComposeBusy || Boolean(editingAnswerId)}
                  >
                    {isSubmitting ? 'Posting…' : 'Post Your Answer'}
                  </button>
                </div>
              </form>
            </section>
          )}
        </div>

        <aside
          className={styles.questionDetail__aside}
          aria-labelledby='related-questions'
        >
          <h2 id='related-questions' className={styles.questionDetail__asideTitle}>
            Related Questions
          </h2>
          {similarQuestions.length === 0 ? (
            <p className={styles.questionDetail__asideEmpty}>
              No related threads found yet.
            </p>
          ) : (
            <div className={styles.questionDetail__relatedList}>
              {similarQuestions.map(item => (
                <RelatedQuestionCard key={item.id ?? item.questionHash} item={item} />
              ))}
            </div>
          )}
        </aside>
      </div>

      <ConfirmModal
        open={isDeleteModalOpen}
        title='Delete this answer?'
        message='This permanently removes your answer from the thread. This action cannot be undone.'
        confirmLabel='Delete answer'
        confirmBusyLabel='Deleting…'
        cancelLabel='Keep answer'
        tone='danger'
        confirmLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
}
