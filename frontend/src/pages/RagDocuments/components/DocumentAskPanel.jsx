import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import RagAnswerBody from '../../../components/RagAnswerBody/RagAnswerBody.jsx';
import { queryDocument } from '../../../services/rag/query-document.js';
import styles from '../RagDocuments.module.css';

export default function DocumentAskPanel({ documentId }) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);
  const [hasAsked, setHasAsked] = useState(false);

  useEffect(() => {
    setQuery('');
    setSubmittedQuery('');
    setAnswer('');
    setCitations([]);
    setError(null);
    setHasAsked(false);
  }, [documentId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsAsking(true);
    setError(null);
    setHasAsked(true);
    setSubmittedQuery(trimmedQuery);
    setAnswer('');
    setCitations([]);

    try {
      const data = await queryDocument(documentId, trimmedQuery);
      setAnswer(data.answer ?? '');
      setCitations(Array.isArray(data.citations) ? data.citations : []);

      if (!data.answer?.trim()) {
        setError('Could not get an answer.');
      }
    } catch {
      setAnswer('');
      setCitations([]);
      setError('Could not get an answer.');
    } finally {
      setIsAsking(false);
    }
  }

  return (
    <section className={styles.ragDocuments__section} aria-labelledby='rag-ask-heading'>
      <header className={styles.ragDocuments__sectionHeader}>
        <h3 id='rag-ask-heading' className={styles.ragDocuments__sectionTitle}>
          Ask with AI
        </h3>
        <p className={styles.ragDocuments__sectionHint}>
          Answers use only retrieved excerpts from this PDF, with citations where
          possible. If the document does not cover your question, the model should
          say so.
        </p>
      </header>

      <form className={styles.ragDocuments__sectionForm} onSubmit={handleSubmit}>
        <label className={styles.ragDocuments__fieldLabel} htmlFor='rag-ask-query'>
          Question
        </label>
        <textarea
          id='rag-ask-query'
          className={styles.ragDocuments__fieldTextarea}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder='Ask a clear question in plain language…'
          rows={4}
          disabled={isAsking}
        />
        <button
          type='submit'
          className={styles.ragDocuments__primaryBtn}
          disabled={isAsking || !query.trim()}
        >
          {isAsking ? (
            <>
              <Loader2 size={16} className={styles.ragDocuments__spin} aria-hidden />
              Asking…
            </>
          ) : (
            <>
              <Sparkles size={16} strokeWidth={2} aria-hidden />
              Ask
            </>
          )}
        </button>
      </form>

      {error ? (
        <p className={styles.ragDocuments__alertError} role='alert'>
          {error}
        </p>
      ) : null}

      {!isAsking && hasAsked && answer.trim() && !error ? (
        <div className={styles.ragDocuments__askAnswer}>
          <p className={styles.ragDocuments__askAnswerEyebrow}>
            Answer for &ldquo;{submittedQuery}&rdquo;
          </p>
          <RagAnswerBody>{answer}</RagAnswerBody>
          {citations.length > 0 ? (
            <div className={styles.ragDocuments__citations}>
              <p className={styles.ragDocuments__citationsTitle}>Citations</p>
              <ul className={styles.ragDocuments__citationsList}>
                {citations.map(citation => (
                  <li key={`${citation.ref}-${citation.chunkIndex}`}>
                    [{citation.ref}] Chunk {citation.chunkIndex}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
