import { ArrowUp, Loader2 } from 'lucide-react';
import styles from '../ChatBot.module.css';

/**
 * @param {{
 *   message: string,
 *   onMessageChange: (value: string) => void,
 *   onSubmit: (event: React.FormEvent) => void,
 *   isSending: boolean,
 *   disabled: boolean,
 *   inputId?: string,
 *   compact?: boolean,
 * }} props
 */
export default function ChatInputPanel({
  message,
  onMessageChange,
  onSubmit,
  isSending,
  disabled,
  inputId = 'chatbot-message',
  compact = false,
}) {
  const canSend = !disabled && !isSending && Boolean(message.trim());

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSend) {
        onSubmit(event);
      }
    }
  }

  return (
    <form
      className={`${styles.chatBot__composer} ${
        compact ? styles['chatBot__composer--compact'] : ''
      }`}
      onSubmit={onSubmit}
    >
      <label className={styles.chatBot__srOnly} htmlFor={inputId}>
        Your message
      </label>
      <div className={styles.chatBot__composerShell}>
        <textarea
          id={inputId}
          className={styles.chatBot__composerInput}
          value={message}
          onChange={event => onMessageChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder='Ask anything about Evangadi…'
          rows={compact ? 1 : 2}
          disabled={disabled || isSending}
        />
        <button
          type='submit'
          className={styles.chatBot__sendBtn}
          disabled={!canSend}
          aria-label={isSending ? 'Sending message' : 'Send message'}
          title={isSending ? 'Sending…' : 'Send'}
        >
          {isSending ? (
            <Loader2 size={18} className={styles.chatBot__spin} aria-hidden />
          ) : (
            <ArrowUp size={18} strokeWidth={2.25} aria-hidden />
          )}
        </button>
      </div>
      <p className={styles.chatBot__composerHint}>
        Enter to send · Shift+Enter for a new line
      </p>
    </form>
  );
}
