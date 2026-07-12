/**
 * Evangadi assistant: conversational Q&A grounded in the shared knowledge base.
 */
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { getChatbotStatus } from '../../services/chatbot/get-chatbot-status.js';
import { sendChatMessage } from '../../services/chatbot/send-chat-message.js';
import ui from '../../styles/pageStates.module.css';
import ChatInputPanel from './components/ChatInputPanel.jsx';
import ChatMessageList from './components/ChatMessageList.jsx';
import styles from './ChatBot.module.css';

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function ChatBot() {
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [knowledgeBaseName, setKnowledgeBaseName] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      setIsLoadingStatus(true);
      setStatusError(null);

      try {
        const data = await getChatbotStatus();
        if (!cancelled) {
          setIsReady(data.ready);
          setKnowledgeBaseName(data.knowledgeBase);
        }
      } catch (err) {
        if (!cancelled) {
          setIsReady(false);
          setStatusError(err.message || 'Could not check chatbot status.');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingStatus(false);
        }
      }
    }

    fetchStatus();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isSending]);

  function handleClearChat() {
    setMessages([]);
    setDraft('');
    setSendError(null);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const trimmedMessage = draft.trim();
    if (!trimmedMessage || isSending || !isReady) return;

    const userMessage = {
      id: createMessageId(),
      role: 'user',
      content: trimmedMessage,
    };

    const nextMessages = [...messages, userMessage];
    const history = messages.map(item => ({
      role: item.role,
      content: item.content,
    }));

    setMessages(nextMessages);
    setDraft('');
    setSendError(null);
    setIsSending(true);

    try {
      const data = await sendChatMessage(trimmedMessage, history);

      setMessages(prev => [
        ...prev,
        {
          id: createMessageId(),
          role: 'assistant',
          content: data.answer || 'I could not generate a response.',
          citations: Array.isArray(data.citations) ? data.citations : [],
        },
      ]);
    } catch (err) {
      setSendError(err.message || 'Could not send your message.');
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className={styles.chatBot}>
      <section className={styles.chatBot__hero} aria-labelledby='chatbot-title'>
        <div className={styles.chatBot__heroCopy}>
          <p className={styles.chatBot__kicker}>Evangadi assistant</p>
          <h1 id='chatbot-title' className={styles.chatBot__title}>
            Ask about Evangadi
          </h1>
          <p className={styles.chatBot__lead}>
            Chat with an AI assistant grounded in the Evangadi Networks knowledge base.
            Answers cite relevant excerpts when possible and stay within official
            information only.
          </p>
        </div>
        {messages.length > 0 ? (
          <button
            type='button'
            className={styles.chatBot__clearBtn}
            onClick={handleClearChat}
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
            <ChatMessageList messages={messages} />
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
            onSubmit={handleSubmit}
            isSending={isSending}
            disabled={!isReady}
          />
        </section>
      )}
    </div>
  );
}
