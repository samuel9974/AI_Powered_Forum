import { useEffect, useState } from 'react';
import { Loader2, Sparkles } from 'lucide-react';
import { searchInDocument } from '../../../services/rag/search-in-document.js';
import styles from '../RagDocuments.module.css';

export default function DocumentSearchPanel({ documentId }) {
  const [query, setQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    setQuery('');
    setSubmittedQuery('');
    setResults([]);
    setError(null);
    setHasSearched(false);
  }, [documentId]);

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setSubmittedQuery(trimmedQuery);

    try {
      const data = await searchInDocument(documentId, trimmedQuery);
      setResults(Array.isArray(data.results) ? data.results : []);
    } catch {
      setResults([]);
      setError('Search failed.');
    } finally {
      setIsSearching(false);
    }
  }

  return (
    <section className={styles.ragDocuments__section} aria-labelledby='rag-search-heading'>
      <header className={styles.ragDocuments__sectionHeader}>
        <h3 id='rag-search-heading' className={styles.ragDocuments__sectionTitle}>
          Semantic search
        </h3>
        <p className={styles.ragDocuments__sectionHint}>
          Finds passages by meaning (embeddings), not only exact keywords.
        </p>
      </header>

      <form className={styles.ragDocuments__sectionForm} onSubmit={handleSubmit}>
        <label className={styles.ragDocuments__fieldLabel} htmlFor='rag-search-query'>
          Search query
        </label>
        <input
          id='rag-search-query'
          type='search'
          className={styles.ragDocuments__fieldInput}
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder='Describe the topic or phrase you are looking for'
          disabled={isSearching}
        />
        <button
          type='submit'
          className={styles.ragDocuments__primaryBtn}
          disabled={isSearching || !query.trim()}
        >
          {isSearching ? (
            <>
              <Loader2 size={16} className={styles.ragDocuments__spin} aria-hidden />
              Searching…
            </>
          ) : (
            <>
              <Sparkles size={16} strokeWidth={2} aria-hidden />
              Search
            </>
          )}
        </button>
      </form>

      {error ? (
        <p className={styles.ragDocuments__alertError} role='alert'>
          {error}
        </p>
      ) : null}

      {!isSearching && hasSearched && results.length === 0 && !error ? (
        <p className={styles.ragDocuments__emptyHint}>
          No matching excerpts found for &ldquo;{submittedQuery}&rdquo;.
        </p>
      ) : null}

      {!isSearching && results.length > 0 ? (
        <ul className={styles.ragDocuments__searchResults}>
          {results.map(result => (
            <li key={result.chunkId ?? `${result.chunkIndex}-${result.score}`}>
              <article className={styles.ragDocuments__searchResult}>
                <header className={styles.ragDocuments__searchResultHeader}>
                  <span className={styles.ragDocuments__searchResultChunk}>
                    Chunk {result.chunkIndex}
                  </span>
                  <span className={styles.ragDocuments__searchResultScore}>
                    Score {result.score.toFixed(2)}
                  </span>
                </header>
                <p className={styles.ragDocuments__searchResultExcerpt}>
                  {result.excerpt}
                </p>
              </article>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
