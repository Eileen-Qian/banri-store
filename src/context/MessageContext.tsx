"use client";

import {
  createContext,
  useCallback,
  useState,
  type ReactNode,
} from "react";

interface Message {
  id: number;
  text: string;
  success: boolean;
}

interface MessageContextValue {
  messages: Message[];
  showSuccess: (text: string) => void;
  showError: (text: string) => void;
}

export const MessageContext = createContext<MessageContextValue>({
  messages: [],
  showSuccess: () => {},
  showError: () => {},
});

let nextId = 0;

export function MessageProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<Message[]>([]);

  const addMessage = useCallback((text: string, success: boolean) => {
    const id = ++nextId;
    setMessages((prev) => [...prev, { id, text, success }]);
    setTimeout(() => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, 3000);
  }, []);

  const showSuccess = useCallback(
    (text: string) => addMessage(text, true),
    [addMessage],
  );
  const showError = useCallback(
    (text: string) => addMessage(text, false),
    [addMessage],
  );

  return (
    <MessageContext.Provider value={{ messages, showSuccess, showError }}>
      {children}
    </MessageContext.Provider>
  );
}
