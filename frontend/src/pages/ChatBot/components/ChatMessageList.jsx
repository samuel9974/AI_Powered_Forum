import RagAnswerBody from '../../../components/RagAnswerBody/RagAnswerBody.jsx';
import styles from '../ChatBot.module.css';

/**
 * @param {{ messages: Array<{ id: string, role: 'user'|'assistant', content: string, citations?: Array }> }} props
 */
export default function ChatMessageList({ messages }) {
  if (messages.length === 0) {
    return (
      <div className={styles.chatBot__emptyChat}>
        <p className={styles.chatBot__emptyTitle}>Start a conversation</p>
        <p className={styles.chatBot__emptyHint}>
          Ask about Evangadi programs, admissions, schedules, or campus life. Answers
          are grounded in the official Evangadi knowledge base with citations when
          available.
        </p>
        <ul className={styles.chatBot__suggestions}>
          <li>What programs does Evangadi offer?</li>
          <li>How do I apply or register?</li>
          <li>What are the class schedules like?</li>
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
          <p className={styles.chatBot__messageLabel}>
            {message.role === 'user' ? 'You' : 'Evangadi assistant'}
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
                  <li key={`${message.id}-${citation.ref}-${citation.chunkIndex}`}>
                    [{citation.ref}] {citation.excerpt || `Chunk ${citation.chunkIndex}`}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
