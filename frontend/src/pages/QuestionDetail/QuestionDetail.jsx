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
import { useAuth } from '../../contexts/AuthContext';
import { isAuthoredByUser } from '../../lib/utils.js';
import { answerService } from '../../services/answer/answer.service.js';
import { questionService } from '../../services/question/question.service.js';
import ui from '../../styles/pageStates.module.css';
import styles from './QuestionDetail.module.css';

const ANSWER_MIN = 20;

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

function AnswerCard({ answer }) {
  return (
    <article className={styles.questionDetail__answerCard}>
      <header className={styles.questionDetail__answerHeader}>
        <AuthorBadge author={answer.author} />
        <div>
          <p className={styles.questionDetail__answerAuthor}>
            {getAuthorName(answer.author)}
          </p>
          <p className={styles.questionDetail__answerDate}>
            {formatPostedDate(answer.createdAt)}
          </p>
        </div>
      </header>
      <MarkdownBody
        content={answer.content}
        className={styles.questionDetail__markdown}
      />
    </article>
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

  const isOwnQuestion = isAuthoredByUser(question, user);
  const isBusy = isSubmitting || isCheckingFit;
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
        }
      } catch (err) {
        if (!cancelled) {
          setQuestion(null);
          setAnswers([]);
          setSimilarQuestions([]);
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

  const applyMarkdown = type => {
    const textarea = answerRef.current;
    if (!textarea) return;

    let result;
    if (type === 'bold') result = wrapSelection(textarea, '**');
    else if (type === 'italic') result = wrapSelection(textarea, '*');
    else if (type === 'code') result = wrapSelection(textarea, '`');
    else if (type === 'link') result = wrapSelection(textarea, '[', '](url)');

    if (!result) return;

    setAnswerText(result.next);
    setAnswerError(null);
    setSubmitError(null);
    setFitResult(null);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const validateAnswer = () => {
    const trimmed = answerText.trim();
    if (!trimmed) {
      return 'Answer content is required';
    }
    if (trimmed.length < ANSWER_MIN) {
      return `Answer content must be at least ${ANSWER_MIN} characters`;
    }
    return null;
  };

  const handleCheckFit = async () => {
    const validationMessage = validateAnswer();
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

  const handleSubmitAnswer = async event => {
    event.preventDefault();
    setSubmitError(null);

    const validationMessage = validateAnswer();
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
    } catch (err) {
      setSubmitError(err.message || 'Failed to post answer. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                {sortedAnswers.map(answer => (
                  <AnswerCard key={answer.id} answer={answer} />
                ))}
              </div>
            )}
          </section>

          {isOwnQuestion ? (
            <div className={styles.questionDetail__ownNote}>
              You authored this thread. You cannot post an answer to your own
              question, but you can edit context or wait for peers to reply.
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
                        onClick={() => applyMarkdown('bold')}
                        disabled={isBusy}
                        aria-label='Bold'
                      >
                        <Bold size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyMarkdown('italic')}
                        disabled={isBusy}
                        aria-label='Italic'
                      >
                        <Italic size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyMarkdown('code')}
                        disabled={isBusy}
                        aria-label='Inline code'
                      >
                        <Code2 size={15} strokeWidth={2.25} aria-hidden />
                      </button>
                      <button
                        type='button'
                        className={styles.questionDetail__toolbarBtn}
                        onClick={() => applyMarkdown('link')}
                        disabled={isBusy}
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
                    disabled={isBusy}
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
                    disabled={isBusy}
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
                    disabled={isBusy}
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
    </div>
  );
}
