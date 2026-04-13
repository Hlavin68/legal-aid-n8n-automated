import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { chatAPI, handleAPIError } from "../services/api";
import ChatContainer from "../components/ChatContainer";
import InputBox from "../components/InputBox";

const API_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5000";

export function ChatPage() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "bot",
      text:
        user?.role === "lawyer"
          ? "Welcome! I'm your legal analysis assistant. Ask about case strategy, drafting, research, and precedents."
          : "Welcome! Ask about land, employment, family, criminal, or business law."
    }
  ]);

  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  /* AUTO SCROLL */
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    const userMessage = {
      id: Date.now(),
      role: "user",
      text: message
    };

    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage({
        message,
        role: user?.role || "client",
        history: messages.filter((m) => m.id > 1).slice(-5)
      });

      const botMessage = {
        id: Date.now() + 1,
        role: "bot",
        text: response.data.response
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const apiErr = handleAPIError(error);

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "bot",
          text: `❌ Error: ${apiErr.message}. Backend: ${API_URL}`
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (!window.confirm("Clear chat history?")) return;

    setMessages([
      {
        id: 1,
        role: "bot",
        text: "Chat cleared. Ask your legal questions."
      }
    ]);
  };

  return (
    <div className="container-fluid vh-100 bg-light d-flex flex-column">

      {/* CENTER CONTAINER */}
      <div className="container flex-grow-1 d-flex flex-column">

        {/* HEADER */}
        <div className="row justify-content-center mt-3">
          <div className="col-12 col-lg-10">

            <div className="card shadow-sm border-0">
              <div className="card-body d-flex justify-content-between align-items-center">

                <div>
                  <h5 className="mb-0">🏛️ Kenyan Legal AI Assistant</h5>
                  <small className="text-muted">
                    {user?.role === "lawyer"
                      ? "Professional legal analysis mode"
                      : "Your personal legal guide"}
                  </small>
                </div>

                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={handleClear}
                >
                  Clear Chat
                </button>

              </div>
            </div>

          </div>
        </div>

        {/* CHAT BOX */}
        <div className="row flex-grow-1 justify-content-center mt-3">

          <div className="col-12 col-lg-10 d-flex">

            <div className="card shadow-sm border-0 flex-grow-1 d-flex flex-column position-relative">

              {/* MESSAGES */}
              <div
                className="flex-grow-1 overflow-auto p-3"
                style={{
                  background: "#f8f9fa"
                }}
              >
                <ChatContainer
                  messages={messages}
                  ref={chatEndRef}
                />

                <div ref={chatEndRef} />
              </div>

              {/* INPUT AREA */}
              <div className="border-top bg-white p-3">

                <InputBox
                  onSendMessage={handleSendMessage}
                  onClear={handleClear}
                  isLoading={loading}
                />

              </div>

            </div>

          </div>

        </div>

      </div>
    </div>
  );
}

export default ChatPage;