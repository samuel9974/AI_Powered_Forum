/**
 * My Questions: threads authored by the signed-in user (`GET /api/questions?mine=true`).
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import QuestionCard from '../../components/QuestionCard/QuestionCard.jsx';
import { questionService } from '../../services/question/question.service.js';
import ui from '../../styles/pageStates.module.css';
import styles from './MyQuestions.module.css';

export default function MyQuestions() {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMyQuestions() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await questionService.getQuestions({ mine: true });
        if (!cancelled) {
          setQuestions(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (!cancelled) {
          setQuestions([]);
          setError(err.message || 'Failed to fetch questions.');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchMyQuestions();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={styles.myQuestions}>
      <section className={styles.myQuestions__hero} aria-labelledby='my-questions-title'>
        <div className={styles.myQuestions__heroCopy}>
          <p className={styles.myQuestions__kicker}>Your workspace</p>
          <h1 id='my-questions-title' className={styles.myQuestions__title}>
            Your topics
          </h1>
          <p className={styles.myQuestions__lead}>
            Only questions you created. Open one to read answers or add follow-ups.
            Rows use the same left accent as your threads on Home.
          </p>
        </div>
        <button
          type='button'
          className={styles.myQuestions__newBtn}
          onClick={() => navigate('/questions/ask')}
        >
          <Plus size={16} strokeWidth={2.25} aria-hidden />
          New question
        </button>
      </section>

      <section className={styles.myQuestions__feed} aria-label='Your question threads'>
        <div className={styles.myQuestions__feedBody}>
          {isLoading ? (
            <div
              className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}
            >
              Loading your questions…
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
              You have not asked any questions yet.{' '}
              <Link to='/questions/ask'>Ask a question</Link> in the sidebar to
              start.
            </div>
          ) : (
            <ul className={styles.myQuestions__list}>
              {questions.map(question => (
                <li key={question.id ?? question.questionHash}>
                  <QuestionCard question={question} isOwn />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
