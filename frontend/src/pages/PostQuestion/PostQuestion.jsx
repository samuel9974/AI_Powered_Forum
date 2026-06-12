/**
 * Post Question: publish a new thread with client-side validation and AI draft coach.
 */
import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bold,
  CheckCircle2,
  Code2,
  Italic,
  Link2,
  Send,
  Sparkles,
} from 'lucide-react';
import { questionService } from '../../services/question/question.service.js';
import styles from './PostQuestion.module.css';

const TITLE_MIN = 5;
const TITLE_MAX = 255;
const CONTENT_MIN = 10;

function validateForm({ title, content }) {
  const errors = {};
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle) {
    errors.title = 'Question title is required';
  } else if (trimmedTitle.length < TITLE_MIN) {
    errors.title = `Question title must be at least ${TITLE_MIN} characters`;
  } else if (trimmedTitle.length > TITLE_MAX) {
    errors.title = `Question title must be between ${TITLE_MIN} and ${TITLE_MAX} characters`;
  }

  if (!trimmedContent) {
    errors.content = 'Question content is required';
  } else if (trimmedContent.length < CONTENT_MIN) {
    errors.content = `Question content must be at least ${CONTENT_MIN} characters`;
  }

  return errors;
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

export default function PostQuestion() {
  const navigate = useNavigate();
  const contentRef = useRef(null);

  const [formData, setFormData] = useState({ title: '', content: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [submitError, setSubmitError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCoaching, setIsCoaching] = useState(false);
  const [coachTips, setCoachTips] = useState(null);
  const [coachError, setCoachError] = useState(null);
  const [publishedQuestion, setPublishedQuestion] = useState(null);

  const isBusy = isSubmitting || isCoaching;
  const contentLength = formData.content.length;

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => ({ ...prev, [field]: undefined }));
    setSubmitError(null);
  };

  const applyMarkdown = type => {
    const textarea = contentRef.current;
    if (!textarea) return;

    let result;
    if (type === 'bold') {
      result = wrapSelection(textarea, '**');
    } else if (type === 'italic') {
      result = wrapSelection(textarea, '*');
    } else if (type === 'code') {
      result = wrapSelection(textarea, '`');
    } else if (type === 'link') {
      result = wrapSelection(textarea, '[', '](url)');
    }

    if (!result) return;

    updateField('content', result.next);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(result.cursor, result.cursor);
    });
  };

  const handleCoach = async () => {
    const trimmedContent = formData.content.trim();
    if (!trimmedContent) {
      setFieldErrors(prev => ({
        ...prev,
        content: `Question content must be at least ${CONTENT_MIN} characters`,
      }));
      return;
    }

    setIsCoaching(true);
    setCoachError(null);
    setCoachTips(null);

    try {
      const data = await questionService.generateQuestionDraftCoach({
        title: formData.title.trim(),
        content: trimmedContent,
      });
      setCoachTips(data.tips ?? []);
    } catch (err) {
      setCoachError(err.message || 'AI suggestions are temporarily unavailable.');
    } finally {
      setIsCoaching(false);
    }
  };

  const handleSubmit = async event => {
    event.preventDefault();
    setSubmitError(null);

    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const question = await questionService.createQuestion({
        title: formData.title.trim(),
        content: formData.content.trim(),
      });
      setPublishedQuestion(question);
    } catch (err) {
      setSubmitError(err.message || 'Failed to post question. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAskAnother = () => {
    setFormData({ title: '', content: '' });
    setFieldErrors({});
    setSubmitError(null);
    setCoachTips(null);
    setCoachError(null);
    setPublishedQuestion(null);
  };

  if (publishedQuestion) {
    return (
      <div className={styles.postQuestion}>
        <header className={styles.postQuestion__hero}>
          <p className={styles.postQuestion__kicker}>Ask the cohort</p>
          <h1 className={styles.postQuestion__title}>Publish to the forum</h1>
          <p className={styles.postQuestion__lead}>
            Public threads help the whole cohort. Write as if a classmate will debug
            your issue tomorrow. They only know what you put on the page.
          </p>
        </header>

        <div className={styles.postQuestion__successCard} role='status'>
          <div className={styles.postQuestion__successIcon} aria-hidden>
            <CheckCircle2 size={28} strokeWidth={2} />
          </div>
          <h2 className={styles.postQuestion__successTitle}>Thread published</h2>
          <p className={styles.postQuestion__successText}>
            Your post is indexed for keyword search and embedding-based similarity.
            Share the link in study groups, or stay on the thread to answer follow-up
            questions from peers.
          </p>
          <div className={styles.postQuestion__successActions}>
            <button
              type='button'
              className={styles.postQuestion__cancelBtn}
              onClick={() => navigate('/dashboard')}
            >
              Back to Dashboard
            </button>
            <button
              type='button'
              className={`${styles.postQuestion__submitBtn} ${styles['postQuestion__submitBtn--primary']}`}
              onClick={() =>
                navigate(`/questions/${publishedQuestion.questionHash}`)
              }
            >
              View Question
            </button>
            <button
              type='button'
              className={`${styles.postQuestion__submitBtn} ${styles['postQuestion__submitBtn--secondary']}`}
              onClick={handleAskAnother}
            >
              Ask Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.postQuestion}>
      <header className={styles.postQuestion__hero}>
        <p className={styles.postQuestion__kicker}>Ask the cohort</p>
        <h1 className={styles.postQuestion__title}>Publish to the forum</h1>
        <p className={styles.postQuestion__lead}>
          Public threads help the whole cohort. Write as if a classmate will debug
          your issue tomorrow. They only know what you put on the page.
        </p>
      </header>

      <aside className={styles.postQuestion__guide} aria-label='Posting guidelines'>
        <h2 className={styles.postQuestion__guideTitle}>
          Write questions people can answer in one pass
        </h2>
        <p className={styles.postQuestion__guideLead}>
          Give runnable context: what you tried, what you expected, and what happened
          instead. Peers should not need a live call to reproduce the issue.
        </p>
        <p className={styles.postQuestion__guideHeading}>Checklist before you post</p>
        <ul className={styles.postQuestion__guideList}>
          <li>
            <strong>Title as a headline</strong> — e.g. &ldquo;React 19: state resets
            after navigation&rdquo;, not &ldquo;help pls&rdquo;.
          </li>
          <li>
            <strong>Repro steps</strong> — numbered steps, environment (OS, browser,
            package versions).
          </li>
          <li>
            <strong>Minimal code</strong> — fenced markdown blocks; trim unrelated
            files.
          </li>
          <li>
            <strong>Exact errors</strong> — copy stack traces or console output
            verbatim.
          </li>
        </ul>
        <p className={styles.postQuestion__guideHeading}>
          Validation rules (enforced by the form)
        </p>
        <ul className={styles.postQuestion__guideList}>
          <li>
            <strong>Title length</strong> — {TITLE_MIN} to {TITLE_MAX} characters.
          </li>
          <li>
            <strong>Body length</strong> — minimum {CONTENT_MIN} characters.
          </li>
          <li>
            <strong>Single topic</strong> — split unrelated bugs into separate
            threads.
          </li>
        </ul>
      </aside>

      <form className={styles.postQuestion__form} onSubmit={handleSubmit} noValidate>
        {submitError ? (
          <div className={styles.postQuestion__alert} role='alert'>
            {submitError}
          </div>
        ) : null}

        <div className={styles.postQuestion__field}>
          <label htmlFor='question-title' className={styles.postQuestion__label}>
            Title
          </label>
          <p className={styles.postQuestion__hint}>
            Be specific and imagine you&apos;re asking a question to another person.
          </p>
          <input
            id='question-title'
            type='text'
            className={`${styles.postQuestion__input} ${
              fieldErrors.title ? styles['postQuestion__input--error'] : ''
            }`}
            placeholder='e.g. How do I handle state management using Context API in React?'
            value={formData.title}
            onChange={event => updateField('title', event.target.value)}
            disabled={isBusy}
            aria-invalid={Boolean(fieldErrors.title)}
            aria-describedby={fieldErrors.title ? 'title-error' : undefined}
          />
          {fieldErrors.title ? (
            <p id='title-error' className={styles.postQuestion__fieldError} role='alert'>
              {fieldErrors.title}
            </p>
          ) : null}
        </div>

        <div className={styles.postQuestion__field}>
          <label htmlFor='question-content' className={styles.postQuestion__label}>
            What are the details of your problem?
          </label>
          <p className={styles.postQuestion__hint}>
            Introduce the problem and expand on what you put in the title. Minimum{' '}
            {CONTENT_MIN} characters.
          </p>

          <div
            className={`${styles.postQuestion__editor} ${
              fieldErrors.content ? styles['postQuestion__editor--error'] : ''
            }`}
          >
            <div className={styles.postQuestion__toolbar}>
              <div className={styles.postQuestion__toolbarGroup}>
                <button
                  type='button'
                  className={styles.postQuestion__toolbarBtn}
                  onClick={() => applyMarkdown('bold')}
                  disabled={isBusy}
                  aria-label='Bold'
                >
                  <Bold size={15} strokeWidth={2.25} aria-hidden />
                </button>
                <button
                  type='button'
                  className={styles.postQuestion__toolbarBtn}
                  onClick={() => applyMarkdown('italic')}
                  disabled={isBusy}
                  aria-label='Italic'
                >
                  <Italic size={15} strokeWidth={2.25} aria-hidden />
                </button>
                <button
                  type='button'
                  className={styles.postQuestion__toolbarBtn}
                  onClick={() => applyMarkdown('code')}
                  disabled={isBusy}
                  aria-label='Inline code'
                >
                  <Code2 size={15} strokeWidth={2.25} aria-hidden />
                </button>
                <button
                  type='button'
                  className={styles.postQuestion__toolbarBtn}
                  onClick={() => applyMarkdown('link')}
                  disabled={isBusy}
                  aria-label='Link'
                >
                  <Link2 size={15} strokeWidth={2.25} aria-hidden />
                </button>
              </div>
              <span className={styles.postQuestion__charCount}>
                {contentLength} character{contentLength === 1 ? '' : 's'}
              </span>
            </div>
            <textarea
              id='question-content'
              ref={contentRef}
              className={styles.postQuestion__textarea}
              placeholder='Include all the information someone would need to answer your question… You can use Markdown to format your code!'
              value={formData.content}
              onChange={event => updateField('content', event.target.value)}
              disabled={isBusy}
              rows={10}
              aria-invalid={Boolean(fieldErrors.content)}
              aria-describedby={
                fieldErrors.content ? 'content-error' : undefined
              }
            />
          </div>
          {fieldErrors.content ? (
            <p
              id='content-error'
              className={styles.postQuestion__fieldError}
              role='alert'
            >
              {fieldErrors.content}
            </p>
          ) : null}
        </div>

        <div className={styles.postQuestion__coachRow}>
          <button
            type='button'
            className={styles.postQuestion__coachBtn}
            onClick={handleCoach}
            disabled={isBusy}
          >
            <Sparkles size={14} strokeWidth={2} aria-hidden />
            {isCoaching ? 'Getting suggestions…' : 'AI suggestions'}
          </button>
          <span className={styles.postQuestion__coachNote}>
            Suggestions only. You still choose what to post.
          </span>
        </div>

        {coachError ? (
          <div className={styles.postQuestion__coachError} role='alert'>
            {coachError}
          </div>
        ) : null}

        {coachTips?.length ? (
          <div className={styles.postQuestion__coachPanel} aria-live='polite'>
            <p className={styles.postQuestion__coachPanelTitle}>AI draft coach</p>
            <ul className={styles.postQuestion__coachList}>
              {coachTips.map(tip => (
                <li key={tip}>{tip}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className={styles.postQuestion__actions}>
          <button
            type='button'
            className={styles.postQuestion__cancelBtn}
            onClick={() => navigate('/dashboard')}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type='submit'
            className={`${styles.postQuestion__submitBtn} ${styles['postQuestion__submitBtn--primary']}`}
            disabled={isBusy}
          >
            <Send size={16} strokeWidth={2} aria-hidden />
            {isSubmitting ? 'Posting…' : 'Post Question'}
          </button>
        </div>
      </form>
    </div>
  );
}
