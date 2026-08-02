import { createContext, useCallback, useContext, useState } from 'react';
import { useChatBotSession } from '../pages/ChatBot/hooks/useChatBotSession.js';

const ChatSessionContext = createContext(null);

/**
 * Keeps one assistant conversation + docked-panel open state alive across the
 * authenticated shell so Ask AI persists while users navigate between pages.
 */
export function ChatSessionProvider({ children }) {
  const session = useChatBotSession();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(
    () => setIsDrawerOpen(prev => !prev),
    [],
  );

  return (
    <ChatSessionContext.Provider
      value={{
        ...session,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
      }}
    >
      {children}
    </ChatSessionContext.Provider>
  );
}

export function useChatSession() {
  const value = useContext(ChatSessionContext);
  if (!value) {
    throw new Error('useChatSession must be used within ChatSessionProvider');
  }
  return value;
}
