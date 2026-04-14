import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { chatAPI, handleAPIError } from "../services/api";
import ChatContainer from "../components/ChatContainer";
import InputBox from "../components/InputBox";
import ChatHistorySidebar from "../components/ChatHistorySidebar";

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
  const [sessionId, setSessionId] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("New Chat");
  const [loadingSession, setLoadingSession] = useState(false);
  const chatEndRef = useRef(null);

  // Create a new session on mount
  useEffect(() => {
    const initializeSession = async () => {
      try {
        setLoadingSession(true);
        const response = await chatAPI.startNewSession({
          title: `Chat - ${new Date().toLocaleDateString()}`
        });
        setSessionId(response.data.session.id);
        setSessionTitle(response.data.session.title);
      } catch (error) {
        console.error("Failed to create session:", error);
        // Continue without session id
      } finally {
        setLoadingSession(false);
      }
    };

    if (user?.id && !sessionId) {
      initializeSession();
    }
  }, [user?.id, sessionId]);

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
        history: messages.filter((m) => m.id > 1).slice(-5),
        sessionId: sessionId
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

  const handleNewChat = async () => {
    try {
      setLoadingSession(true);
      const response = await chatAPI.startNewSession({
        title: `Chat - ${new Date().toLocaleDateString()}`
      });
      setSessionId(response.data.session.id);
      setSessionTitle(response.data.session.title);
      setMessages([
        {
          id: 1,
          role: "bot",
          text:
            user?.role === "lawyer"
              ? "Welcome! I'm your legal analysis assistant. Ask about case strategy, drafting, research, and precedents."
              : "Welcome! Ask about land, employment, family, criminal, or business law."
        }
      ]);
    } catch (error) {
      const apiErr = handleAPIError(error);
      console.error("Failed to create new chat:", apiErr.message);
    } finally {
      setLoadingSession(false);
    }
  };

  const handleLoadSession = async (sessionId) => {
    try {
      setLoadingSession(true);
      const response = await chatAPI.getSessionHistory(sessionId);
      const session = response.data.session;
      
      setSessionId(session.id);
      setSessionTitle(session.title);
      
      // Convert stored messages to chat format
      const formattedMessages = session.messages.map((msg, idx) => ({
        id: idx,
        role: msg.role,
        text: msg.text
      }));
      
      setMessages(
        formattedMessages.length > 0
          ? formattedMessages
          : [
              {
                id: 1,
                role: "bot",
                text: "Chat history loaded. Continue your conversation."
              }
            ]
      );
      setShowHistory(false);
    } catch (error) {
      const apiErr = handleAPIError(error);
      console.error("Failed to load session:", apiErr.message);
    } finally {
      setLoadingSession(false);
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
    <div className="container-fluid vh-100 bg-light d-flex">

      {/* SIDEBAR */}
      {showHistory && (
        <ChatHistorySidebar
          onSelectSession={handleLoadSession}
          onClose={() => setShowHistory(false)}
          isLoading={loadingSession}
        />
      )}

      {/* CENTER CONTAINER */}
      <div className="flex-grow-1 d-flex flex-column">

        {/* HEADER */}
        <div className="row justify-content-center mt-3" style={{ paddingRight: showHistory ? "0" : "auto" }}>
          <div className={`${showHistory ? "col-12 col-lg-9" : "col-12 col-lg-10"}`}>

            <div className="card shadow-sm border-0">
              <div className="card-body d-flex justify-content-between align-items-center">

                <div>
                  <h5 className="mb-0">🏛️ Kenyan Legal AI Assistant</h5>
                  <small className="text-muted">
                    {sessionTitle}
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={() => setShowHistory(!showHistory)}
                    title="View chat history"
                  >
                    📋 History
                  </button>
                  <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={handleNewChat}
                    disabled={loadingSession}
                    title="Start a new chat"
                  >
                    ➕ New Chat
                  </button>
                  <button
                    className="btn btn-sm btn-outline-danger"
                    onClick={handleClear}
                    title="Clear current chat"
                  >
                    🗑️ Clear
                  </button>
                </div>

              </div>
            </div>

          </div>
        </div>

        {/* CHAT BOX */}
        <div className="row flex-grow-1 justify-content-center mt-3">

          <div className={`${showHistory ? "col-12 col-lg-9" : "col-12 col-lg-10"}`}>

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