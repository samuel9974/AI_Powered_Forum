/**
 * Evangadi assistant: conversational Q&A grounded in the shared knowledge base.
 * Session state is shared with the global navbar drawer via ChatSessionProvider.
 */
import { useEffect, useRef } from 'react';
import { RotateCcw, Sparkles } from 'lucide-react';
import { useChatSession } from '../../contexts/ChatSessionContext';
import ui from '../../styles/pageStates.module.css';
import ChatInputPanel from './components/ChatInputPanel.jsx';
import ChatMessageList from './components/ChatMessageList.jsx';
import styles from './ChatBot.module.css';

export default function ChatBot() {
  const messagesEndRef = useRef(null);
  const {
    messages,
    draft,
    setDraft,
    isLoadingStatus,
    statusError,
    isReady,
    knowledgeBaseName,
    isSending,
    sendError,
    clearChat,
    setSuggestion,
    submitMessage,
  } = useChatSession();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  return (
    <div className={styles.chatBot}>
      <section className={styles.chatBot__hero} aria-labelledby='chatbot-title'>
        <div className={styles.chatBot__heroCopy}>
          <p className={styles.chatBot__kicker}>
            <Sparkles size={12} strokeWidth={2.25} aria-hidden />
            Evangadi assistant
          </p>
          <h1 id='chatbot-title' className={styles.chatBot__title}>
            Ask about Evangadi
          </h1>
          <p className={styles.chatBot__lead}>
            Chat with an AI assistant grounded in the Evangadi Networks knowledge
            base. Answers cite relevant excerpts when possible and stay within
            official information only.
          </p>
        </div>
        {messages.length > 0 ? (
          <button
            type='button'
            className={styles.chatBot__clearBtn}
            onClick={clearChat}
            disabled={isSending}
          >
            <RotateCcw size={16} strokeWidth={2} aria-hidden />
            Clear chat
          </button>
        ) : null}
      </section>

      {isLoadingStatus ? (
        <div
          className={`${ui.pageStates__message} ${ui['pageStates__message--loading']}`}
        >
          Checking assistant status…
        </div>
      ) : statusError ? (
        <div
          className={`${ui.pageStates__message} ${ui['pageStates__message--error']}`}
          role='alert'
        >
          {statusError}
        </div>
      ) : !isReady ? (
        <div
          className={`${ui.pageStates__message} ${ui['pageStates__message--empty']}`}
        >
          The Evangadi knowledge base is not ready yet
          {knowledgeBaseName ? ` (${knowledgeBaseName})` : ''}. Please try again
          later or contact an administrator.
        </div>
      ) : (
        <section className={styles.chatBot__workspace} aria-label='Chat conversation'>
          <div className={styles.chatBot__panel}>
            <ChatMessageList
              messages={messages}
              isSending={isSending}
              onSuggestionSelect={setSuggestion}
            />
            <div ref={messagesEndRef} />
          </div>

          {sendError ? (
            <p className={styles.chatBot__alertError} role='alert'>
              {sendError}
            </p>
          ) : null}

          <ChatInputPanel
            message={draft}
            onMessageChange={setDraft}
            onSubmit={submitMessage}
            isSending={isSending}
            disabled={!isReady}
          />
        </section>
      )}
    </div>
  );
}
