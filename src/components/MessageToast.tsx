"use client";

import { useMessage } from "@/hooks/useMessage";

export default function MessageToast() {
  const { messages } = useMessage();

  if (messages.length === 0) return null;

  return (
    <div
      className="position-fixed top-0 end-0 p-3"
      style={{ zIndex: 1090 }}
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className={`toast show align-items-center text-bg-${m.success ? "success" : "danger"} border-0 mb-2`}
          role="alert"
        >
          <div className="d-flex">
            <div className="toast-body">{m.text}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
