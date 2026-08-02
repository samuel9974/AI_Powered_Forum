import { useEffect, useId, useRef } from 'react';
import { PanelRightClose, RotateCcw, Sparkles } from 'lucide-react';
import { useChatSession } from '../../contexts/ChatSessionContext';
import ChatInputPanel from '../../pages/ChatBot/components/ChatInputPanel.jsx';
import ChatMessageList from '../../pages/ChatBot/components/ChatMessageList.jsx';
import styles from './AssistantDrawer.module.css';

/**
 * Persistent right-rail assistant (Hostinger-style).
 * Stays open across in-app navigation and does not block the sidebar/main UI
 * on desktop — the shell reserves space beside the panel instead.
 */
export default function AssistantDrawer() {
  const titleId = useId();
  const messagesEndRef = useRef(null);
  const {
    isDrawerOpen,
    closeDrawer,
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
    if (!isDrawerOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        closeDrawer();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const statusBusy = isLoadingStatus;
  const statusBlocked = Boolean(statusError) || !isReady;

  return (
    <aside
      className={styles.drawer}
      aria-labelledby={titleId}
      aria-label='Ask AI assistant'
    >
      <header className={styles.drawer__header}>
        <div className={styles.drawer__brand}>
          <div className={styles.drawer__brandIcon} aria-hidden>
            <Sparkles size={18} strokeWidth={2} />
          </div>
          <div className={styles.drawer__brandCopy}>
            <h2 id={titleId} className={styles.drawer__title}>
              Ask AI
            </h2>
            <p className={styles.drawer__subtitle}>Evangadi assistant</p>
          </div>
        </div>

        <div className={styles.drawer__actions}>
          {messages.length > 0 ? (
            <button
              type='button'
              className={styles.drawer__iconBtn}
              onClick={clearChat}
              disabled={isSending}
              aria-label='Clear chat'
              title='Clear chat'
            >
              <RotateCcw size={16} strokeWidth={2} aria-hidden />
            </button>
          ) : null}
          <button
            type='button'
            className={styles.drawer__iconBtn}
            onClick={closeDrawer}
            aria-label='Close assistant'
            title='Close assistant'
          >
            <PanelRightClose size={18} strokeWidth={2} aria-hidden />
          </button>
        </div>
      </header>

      <div className={styles.drawer__body}>
        {statusBusy ? (
          <div className={styles.drawer__status}>
            <div className={styles.drawer__statusPulse} aria-hidden />
            Checking assistant status…
          </div>
        ) : statusError ? (
          <div className={styles.drawer__status} role='alert'>
            {statusError}
          </div>
        ) : !isReady ? (
          <div className={styles.drawer__status}>
            The Evangadi knowledge base is not ready yet
            {knowledgeBaseName ? ` (${knowledgeBaseName})` : ''}. Please try
            again later.
          </div>
        ) : (
          <>
            <div className={styles.drawer__messages}>
              <ChatMessageList
                messages={messages}
                isSending={isSending}
                onSuggestionSelect={setSuggestion}
                compact
              />
              <div ref={messagesEndRef} />
            </div>

            {sendError ? (
              <p className={styles.drawer__error} role='alert'>
                {sendError}
              </p>
            ) : null}

            <ChatInputPanel
              message={draft}
              onMessageChange={setDraft}
              onSubmit={submitMessage}
              isSending={isSending}
              disabled={statusBlocked}
              inputId='assistant-drawer-message'
              compact
            />
          </>
        )}
      </div>
    </aside>
  );
}
