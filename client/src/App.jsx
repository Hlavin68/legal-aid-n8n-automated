import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import Header from './components/Header';
import ChatContainer from './components/ChatContainer';
import InputBox from './components/InputBox';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: 'Welcome! Ask about: Land disputes, Employment, Family law, Criminal law, Business contracts, etc.' }
  ]);
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    // Add user message
    const userMessage = { id: Date.now(), role: 'user', text: message };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);

    try {
      const response = await axios.post(`${API_URL}/api/chat/send`, {
        message,
        history: messages.filter(m => m.role !== 'bot' || m.id > 1).slice(-5)
      });

      const botMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: response.data.response
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'bot',
        text: `❌ Error: ${error.message}. Ensure backend is running at ${API_URL}`
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm('Clear chat history?')) {
      setMessages([
        { id: 1, role: 'bot', text: 'Chat cleared! Ask your legal questions.' }
      ]);
    }
  };

  return (
    <div className="app">
      <Header />
      <ChatContainer messages={messages} ref={chatEndRef} />
      <InputBox onSendMessage={handleSendMessage} onClear={handleClear} isLoading={loading} />
    </div>
  );
}

export default App;
