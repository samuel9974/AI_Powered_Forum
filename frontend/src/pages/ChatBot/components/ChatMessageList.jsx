import { Bot, Sparkles } from 'lucide-react';
import RagAnswerBody from '../../../components/RagAnswerBody/RagAnswerBody.jsx';
import styles from '../ChatBot.module.css';

const SUGGESTIONS = [
  'What programs does Evangadi offer?',
  'How do I apply or register?',
  'What are the class schedules like?',
];

/**
 * @param {{
 *   messages: Array<{ id: string, role: 'user'|'assistant', content: string, citations?: Array }>,
 *   isSending?: boolean,
 *   onSuggestionSelect?: (suggestion: string) => void,
 *   compact?: boolean,
 * }} props
 */
export default function ChatMessageList({
  messages,
  isSending = false,
  onSuggestionSelect,
  compact = false,
}) {
  if (messages.length === 0 && !isSending) {
    return (
      <div
        className={`${styles.chatBot__emptyChat} ${
          compact ? styles['chatBot__emptyChat--compact'] : ''
        }`}
      >
        <div className={styles.chatBot__emptyIcon} aria-hidden>
          <Sparkles size={compact ? 22 : 28} strokeWidth={1.75} />
        </div>
        <p className={styles.chatBot__emptyTitle}>How can I help?</p>
        <p className={styles.chatBot__emptyHint}>
          Ask about Evangadi programs, admissions, schedules, or campus life.
          Answers cite the official knowledge base when available.
        </p>
        <ul className={styles.chatBot__suggestions}>
          {SUGGESTIONS.map(suggestion => (
            <li key={suggestion}>
              {onSuggestionSelect ? (
                <button
                  type='button'
                  className={styles.chatBot__suggestionBtn}
                  onClick={() => onSuggestionSelect(suggestion)}
                >
                  {suggestion}
                </button>
              ) : (
                <span className={styles.chatBot__suggestionBtn}>{suggestion}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <ul className={styles.chatBot__messages} aria-live='polite'>
      {messages.map(message => (
        <li
          key={message.id}
          className={`${styles.chatBot__message} ${
            message.role === 'user'
              ? styles['chatBot__message--user']
              : styles['chatBot__message--assistant']
          }`}
        >
          {message.role === 'assistant' ? (
            <div className={styles.chatBot__avatar} aria-hidden>
              <Bot size={14} strokeWidth={2} />
            </div>
          ) : null}

          <div className={styles.chatBot__bubble}>
            <p className={styles.chatBot__messageLabel}>
              {message.role === 'user' ? 'You' : 'Assistant'}
            </p>
            <div className={styles.chatBot__messageBody}>
              {message.role === 'assistant' ? (
                <RagAnswerBody>{message.content}</RagAnswerBody>
              ) : (
                <p className={styles.chatBot__messageText}>{message.content}</p>
              )}
            </div>
            {message.role === 'assistant' &&
            Array.isArray(message.citations) &&
            message.citations.length > 0 ? (
              <div className={styles.chatBot__citations}>
                <p className={styles.chatBot__citationsTitle}>Sources</p>
                <ul className={styles.chatBot__citationsList}>
                  {message.citations.map(citation => (
                    <li
                      key={`${message.id}-${citation.ref}-${citation.chunkIndex}`}
                    >
                      [{citation.ref}]{' '}
                      {citation.excerpt || `Chunk ${citation.chunkIndex}`}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        </li>
      ))}

      {isSending ? (
        <li
          className={`${styles.chatBot__message} ${styles['chatBot__message--assistant']} ${styles['chatBot__message--thinking']}`}
          aria-label='Assistant is thinking'
        >
          <div className={styles.chatBot__avatar} aria-hidden>
            <Bot size={14} strokeWidth={2} />
          </div>
          <div className={styles.chatBot__bubble}>
            <p className={styles.chatBot__messageLabel}>Assistant</p>
            <div className={styles.chatBot__thinking} aria-hidden>
              <span />
              <span />
              <span />
            </div>
          </div>
        </li>
      ) : null}
    </ul>
  );
}
