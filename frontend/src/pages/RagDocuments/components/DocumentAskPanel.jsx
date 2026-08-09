import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import RagAnswerBody from '../../../components/RagAnswerBody/RagAnswerBody.jsx';
import { queryDocument } from '../../../services/rag/query-document.js';
import { RAG_DEEP_EXPLAIN_K } from '../../../services/rag/shared/rag.constants.js';
import {
  collectReferencedPages,
  formatPageList,
  formatPageRange,
} from '../../../services/rag/shared/format-page-range.js';
import styles from '../RagDocuments.module.css';

export default function DocumentAskPanel({ documentId }) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [citations, setCitations] = useState([]);
  const [intent, setIntent] = useState(null);
  const [chunksUsedCount, setChunksUsedCount] = useState(0);
  const [deepExplain, setDeepExplain] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [error, setError] = useState(null);
  const [hasAsked, setHasAsked] = useState(false);

  function resetAnswer() {
    setAnswer('');
    setCitations([]);
    setIntent(null);
    setChunksUsedCount(0);
  }

  useEffect(() => {
    setQuery('');
    setSubmittedQuery('');
    resetAnswer();
    setDeepExplain(false);
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
    resetAnswer();

    try {
      const data = await queryDocument(
        documentId,
        trimmedQuery,
        deepExplain ? { k: RAG_DEEP_EXPLAIN_K } : {},
      );
      setAnswer(data.answer ?? '');
      setCitations(Array.isArray(data.citations) ? data.citations : []);
      setIntent(data.intent ?? 'factual');
      setChunksUsedCount(
        Array.isArray(data.chunksUsed) ? data.chunksUsed.length : 0,
      );

      if (!data.answer?.trim()) {
        setError('Could not get an answer.');
      }
    } catch {
      resetAnswer();
      setError('Could not get an answer.');
    } finally {
      setIsAsking(false);
    }
  }

  const groundedPages = formatPageList(collectReferencedPages(citations));

  return (
    <section className={styles.ragDocuments__section} aria-labelledby='rag-ask-heading'>
      <header className={styles.ragDocuments__sectionHeader}>
        <h3 id='rag-ask-heading' className={styles.ragDocuments__sectionTitle}>
          Ask with AI
        </h3>
        <p className={styles.ragDocuments__sectionHint}>
          Answers are grounded in retrieved PDF excerpts. Overview questions get a
          broader teaching-style answer; specific questions stay precise. Citations
          show which pages supported the reply.
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

        <label className={styles.ragDocuments__deepExplain}>
          <input
            type='checkbox'
            checked={deepExplain}
            onChange={event => setDeepExplain(event.target.checked)}
            disabled={isAsking}
          />
          <span>
            Deep explain
            <span className={styles.ragDocuments__deepExplainHint}>
              {' '}
              — retrieve more excerpts (up to {RAG_DEEP_EXPLAIN_K}) for richer
              overviews
            </span>
          </span>
        </label>

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
          <div className={styles.ragDocuments__askMeta}>
            <p className={styles.ragDocuments__askAnswerEyebrow}>
              Answer for &ldquo;{submittedQuery}&rdquo;
            </p>
            <div className={styles.ragDocuments__askMetaTags}>
              {intent ? (
                <span className={styles.ragDocuments__intentTag}>
                  {intent === 'overview' ? 'Overview' : 'Factual'}
                </span>
              ) : null}
              {chunksUsedCount > 0 ? (
                <span className={styles.ragDocuments__metaTag}>
                  {chunksUsedCount} excerpt{chunksUsedCount === 1 ? '' : 's'}
                </span>
              ) : null}
              {groundedPages ? (
                <span className={styles.ragDocuments__metaTag}>
                  Grounded in {groundedPages}
                </span>
              ) : null}
            </div>
          </div>

          <RagAnswerBody>{answer}</RagAnswerBody>

          {citations.length > 0 ? (
            <div className={styles.ragDocuments__citations}>
              <p className={styles.ragDocuments__citationsTitle}>Sources</p>
              <ul className={styles.ragDocuments__citationsList}>
                {citations.map(citation => {
                  const pageLabel = formatPageRange(citation);
                  return (
                    <li key={`${citation.ref}-${citation.chunkIndex}`}>
                      <span className={styles.ragDocuments__citationRef}>
                        [{citation.ref}]
                      </span>
                      {pageLabel ? (
                        <span className={styles.ragDocuments__citationPage}>
                          {pageLabel}
                        </span>
                      ) : (
                        <span className={styles.ragDocuments__citationPage}>
                          chunk {citation.chunkIndex}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
