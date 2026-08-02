/**
 * Shared Evangadi Assistant session state/handlers.
 * Used by both the /chatbot page and the global slide-over drawer.
 */
import { useCallback, useEffect, useState } from 'react';
import { getChatbotStatus } from '../../../services/chatbot/get-chatbot-status.js';
import { sendChatMessage } from '../../../services/chatbot/send-chat-message.js';

function createMessageId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useChatBotSession() {
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

  const clearChat = useCallback(() => {
    setMessages([]);
    setDraft('');
    setSendError(null);
  }, []);

  const setSuggestion = useCallback(suggestion => {
    setDraft(suggestion);
  }, []);

  const submitMessage = useCallback(
    async event => {
      event.preventDefault();

      const trimmedMessage = draft.trim();
      if (!trimmedMessage || isSending || !isReady) return;

      const userMessage = {
        id: createMessageId(),
        role: 'user',
        content: trimmedMessage,
      };

      const history = messages.map(item => ({
        role: item.role,
        content: item.content,
      }));

      setMessages(prev => [...prev, userMessage]);
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
    },
    [draft, isReady, isSending, messages],
  );

  return {
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
  };
}
