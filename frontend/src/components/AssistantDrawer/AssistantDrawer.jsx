import { useEffect, useId, useRef } from 'react';
import { PanelRightClose, RotateCcw, Sparkles } from 'lucide-react';
import { useChatSession } from '../../contexts/ChatSessionContext';
import ChatInputPanel from '../../pages/ChatBot/components/ChatInputPanel.jsx';
import ChatMessageList from '../../pages/ChatBot/components/ChatMessageList.jsx';
import styles from './AssistantDrawer.module.css';

/**
 * Keep the fixed drawer inside the *visible* viewport while the mobile
 * keyboard is open. Without this, `bottom: 0` sits under the keyboard and
 * the send button disappears.
 * @param {HTMLElement | null} element
 */
function syncDrawerToVisualViewport(element) {
  if (!element) return;

  const vv = window.visualViewport;
  if (!vv) {
    element.style.top = '';
    element.style.height = '';
    element.style.bottom = '';
    return;
  }

  element.style.top = `${vv.offsetTop}px`;
  element.style.height = `${vv.height}px`;
  element.style.bottom = 'auto';
}

/**
 * Persistent right-rail assistant (Hostinger-style).
 * Stays open across in-app navigation and does not block the sidebar/main UI
 * on desktop — the shell reserves space beside the panel instead.
 */
export default function AssistantDrawer() {
  const titleId = useId();
  const drawerRef = useRef(null);
  const composerRef = useRef(null);
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

  // Reposition the drawer when the soft keyboard opens/closes on mobile.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const drawer = drawerRef.current;
    const vv = window.visualViewport;

    const sync = () => syncDrawerToVisualViewport(drawer);
    sync();

    if (!vv) return undefined;

    vv.addEventListener('resize', sync);
    vv.addEventListener('scroll', sync);
    window.addEventListener('resize', sync);

    return () => {
      vv.removeEventListener('resize', sync);
      vv.removeEventListener('scroll', sync);
      window.removeEventListener('resize', sync);
      if (drawer) {
        drawer.style.top = '';
        drawer.style.height = '';
        drawer.style.bottom = '';
      }
    };
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!isDrawerOpen) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending, isDrawerOpen]);

  // When the user focuses the input, keep the composer (and send button) on screen.
  useEffect(() => {
    if (!isDrawerOpen) return undefined;

    const composer = composerRef.current;
    if (!composer) return undefined;

    const onFocusIn = () => {
      // Wait a beat for the keyboard animation, then pin the composer into view.
      window.setTimeout(() => {
        syncDrawerToVisualViewport(drawerRef.current);
        composer.scrollIntoView({ block: 'end', behavior: 'smooth' });
      }, 150);
    };

    composer.addEventListener('focusin', onFocusIn);
    return () => composer.removeEventListener('focusin', onFocusIn);
  }, [isDrawerOpen]);

  if (!isDrawerOpen) return null;

  const statusBusy = isLoadingStatus;
  const statusBlocked = Boolean(statusError) || !isReady;

  return (
    <aside
      ref={drawerRef}
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

            <div ref={composerRef} className={styles.drawer__composer}>
              <ChatInputPanel
                message={draft}
                onMessageChange={setDraft}
                onSubmit={submitMessage}
                isSending={isSending}
                disabled={statusBlocked}
                inputId='assistant-drawer-message'
                compact
              />
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
