import { Loader2, Send } from 'lucide-react';
import styles from '../ChatBot.module.css';

/**
 * @param {{
 *   message: string,
 *   onMessageChange: (value: string) => void,
 *   onSubmit: (event: React.FormEvent) => void,
 *   isSending: boolean,
 *   disabled: boolean,
 * }} props
 */
export default function ChatInputPanel({
  message,
  onMessageChange,
  onSubmit,
  isSending,
  disabled,
}) {
  return (
    <form className={styles.chatBot__composer} onSubmit={onSubmit}>
      <label className={styles.chatBot__composerLabel} htmlFor='chatbot-message'>
        Your message
      </label>
      <textarea
        id='chatbot-message'
        className={styles.chatBot__composerInput}
        value={message}
        onChange={event => onMessageChange(event.target.value)}
        placeholder='Ask about Evangadi programs, admissions, or campus info…'
        rows={3}
        disabled={disabled || isSending}
      />
      <div className={styles.chatBot__composerActions}>
        <button
          type='submit'
          className={styles.chatBot__sendBtn}
          disabled={disabled || isSending || !message.trim()}
        >
          {isSending ? (
            <>
              <Loader2 size={16} className={styles.chatBot__spin} aria-hidden />
              Sending…
            </>
          ) : (
            <>
              <Send size={16} strokeWidth={2} aria-hidden />
              Send
            </>
          )}
        </button>
      </div>
    </form>
  );
}
