/**
 * Dashboard: default home after login; question list, quick actions, URL-driven search.
 * Data: `questionService` (keyword `q`, semantic `semantic`, or full list).
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Library, MessageSquare, PenSquare } from 'lucide-react';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import { useAuth } from '../../contexts/AuthContext';
import { isAuthoredByUser } from '../../lib/utils.js';
import { questionService } from '../../services/question/question.service.js';
import ui from '../../styles/pageStates.module.css';
import styles from './Dashboard.module.css';

const QUICK_ACTIONS = [
  {
    icon: PenSquare,
    title: 'New question',
    description: 'Share context, errors, and what you already tried.',
    path: '/questions/ask',
  },
  {
    icon: MessageSquare,
    title: 'Your topics',
    description: 'Filtered list of threads you authored.',
    path: '/my-questions',
  },
  {
    icon: Library,
    title: 'Knowledge base',
    description:
      'Course library, uploads, and retrieval-backed context for threads.',
    path: '/rag-documents',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const keywordQuery = searchParams.get('q')?.trim() ?? '';
  const semanticQuery = searchParams.get('semantic')?.trim() ?? '';
  const searchMode = semanticQuery ? 'semantic' : 'keyword';

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const firstName = user?.firstName?.trim();
  const welcomeLine = firstName
    ? `Good to see you, ${firstName}.`
    : 'Welcome to the forum.';

  useEffect(() => {
    let cancelled = false;

    async function fetchQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        let data;
        if (searchMode === 'semantic' && semanticQuery) {
          data = await questionService.searchQuestionsSemantic(semanticQuery);
        } else if (keywordQuery) {
          data = await questionService.getQuestions({ search: keywordQuery });
        } else {
          data = await questionService.getQuestions();
        }

        if (!cancelled) {
          setQuestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setQuestions([]);
          setError(err.message || 'Failed to load questions');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchQuestions();

    return () => {
      cancelled = true;
    };
  }, [keywordQuery, semanticQuery, searchMode]);

  const stats = useMemo(() => {
    const questionCount = questions.length;
    const replyCount = questions.reduce(
      (sum, question) => sum + (question.answerCount ?? 0),
      0,
    );
    const unansweredCount = questions.filter(
      question => (question.answerCount ?? 0) === 0,
    ).length;
    const yoursCount = questions.filter(question =>
      isAuthoredByUser(question, user),
    ).length;

    return {
      questionCount,
      replyCount,
      unansweredCount,
      yoursCount,
    };
  }, [questions, user]);

  const emptyMessage =
    keywordQuery || semanticQuery
      ? 'No questions found.'
      : 'No questions found. Be the first to ask!';

  return (
    <div className={styles.dashboard}>
      <section className={styles.dashboard__hero} aria-labelledby='dashboard-welcome'>
        <p className={styles.dashboard__kicker}>Forum home</p>
        <h1 id='dashboard-welcome' className={styles.dashboard__title}>
          {welcomeLine}
        </h1>
        <p className={styles.dashboard__lead}>
          Browse the community feed below, search by keyword in the header, or use
          AI similarity search when you need related threads.
        </p>

        <div className={styles.dashboard__actions}>
          {QUICK_ACTIONS.map(action => (
            <button
              key={action.path}
              type='button'
              className={styles.dashboard__actionCard}
              onClick={() => navigate(action.path)}
            >
              <span className={styles.dashboard__actionIcon} aria-hidden>
                <action.icon size={18} strokeWidth={2} />
              </span>
              <span className={styles.dashboard__actionCopy}>
                <p className={styles.dashboard__actionTitle}>{action.title}</p>
                <p className={styles.dashboard__actionDesc}>{action.description}</p>
              </span>
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className={styles.dashboard__snapshotLoading}>
            Loading snapshot for the list below…
          </p>
        ) : null}

        <div className={styles.dashboard__stats} aria-label='Forum snapshot'>
          <div className={styles.dashboard__stat}>
            <p className={styles.dashboard__statLabel}>Questions</p>
            <p className={styles.dashboard__statValue}>
              {isLoading ? '—' : stats.questionCount}
            </p>
          </div>
          <div className={styles.dashboard__stat}>
            <p className={styles.dashboard__statLabel}>Replies</p>
            <p className={styles.dashboard__statValue}>
              {isLoading ? '—' : stats.replyCount}
            </p>
          </div>
          <div className={styles.dashboard__stat}>
            <p className={styles.dashboard__statLabel}>Unanswered</p>
            <p className={styles.dashboard__statValue}>
              {isLoading ? '—' : stats.unansweredCount}
            </p>
          </div>
          <div className={styles.dashboard__stat}>
            <p className={styles.dashboard__statLabel}>Yours</p>
            <p className={styles.dashboard__statValue}>
              {isLoading ? '—' : stats.yoursCount}
            </p>
          </div>
        </div>
      </section>

      <section className={styles.dashboard__feed} aria-labelledby='discussion-feed'>
        <div className={styles.dashboard__feedHeader}>
          <div>
            <h2 id='discussion-feed' className={styles.dashboard__feedTitle}>
              Discussion feed
            </h2>
            <p className={styles.dashboard__feedSubtitle}>
              Your threads use a slim left accent in this list.
            </p>
          </div>
          <span className={styles.dashboard__feedFilter}>Newest threads</span>
        </div>

        <div className={styles.dashboard__feedBody}>
          {isLoading ? (
            <div
              className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}
            >
              Loading recent questions…
            </div>
          ) : error ? (
            <div
              className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}
              role='alert'
            >
              {error}
            </div>
          ) : questions.length === 0 ? (
            <div
              className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}
            >
              {emptyMessage}
            </div>
          ) : (
            <ul className={styles.dashboard__list}>
              {questions.map(question => (
                <li key={question.id ?? question.questionHash}>
                  <QuestionCard
                    question={question}
                    isOwn={isAuthoredByUser(question, user)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
