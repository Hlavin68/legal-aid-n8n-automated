# Quick Start Guide - MERN Stack

## 🚀 Running the Application

### Method 1: Automated Setup (Recommended)

```bash
cd /home/zero/Desktop/Proj/legal-aid
bash setup.sh
npm start
```

Open http://localhost:3000 in your browser.

### Method 2: Manual Setup

```bash
# Install all dependencies
npm run install-all

# Terminal 1: Start backend
cd server
npm run dev
# Backend runs on http://localhost:5000

# Terminal 2: Start frontend
cd ../client
npm start
# Frontend runs on http://localhost:3000
```

## 📋 Pre-requisites

1. **Node.js & npm** installed
   ```bash
   node --version  # v14+
   npm --version
   ```

2. **n8n running locally**
   ```bash
   n8n start
   # Runs on http://localhost:5678
   ```

## 🔍 Project Structure

```
legal-aid/
├── server/              # Express backend
│   ├── controllers/    # Business logic (chatController.js)
│   ├── routes/        # API routes (chat.js)
│   ├── server.js      # Main Express app
│   ├── package.json
│   └── .env
│
├── client/             # React frontend
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/  # Header, ChatContainer, InputBox, MessageBubble
│   │   ├── App.jsx
│   │   ├── index.js
│   │   └── App.css
│   ├── package.json
│   └── .env
│
└── README.md           # Full documentation
```

## 💻 Development

### Backend API
- **POST** `/api/chat/send` - Send message and get response
- **GET** `/health` - Server health check

### Frontend Components
- `Header` - Title and subtitle
- `ChatContainer` - Message display area
- `MessageBubble` - Individual message
- `InputBox` - User input + buttons

## 🔧 Useful Commands

```bash
# Root level
npm start              # Run both server & client
npm run server        # Backend only
npm run client        # Frontend only
npm run build         # Build for production

# Backend
cd server && npm run dev    # Auto-reload on changes

# Frontend
cd client && npm start      # Dev server with hot reload
```

## ✅ Testing the Setup

1. **Backend is running:**
   ```bash
   curl http://localhost:5000/health
   # Should return: { "status": "Backend is running" }
   ```

2. **Frontend is accessible:**
   - Open http://localhost:3000

3. **n8n is running:**
   - Open http://localhost:5678

4. **Send a test message:**
   - Type in the chat box and click Send
   - Should receive a response from the AI

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| `npm: command not found` | Install Node.js from nodejs.org |
| `Port 3000/5000 in use` | Kill process or change PORT in .env |
| `Can't connect to n8n` | Ensure n8n is running: `n8n start` |
| `CORS error` | Check backend .env N8N_WEBHOOK_URL |
| `React not loading` | Clear browser cache, restart `npm start` |

## 📚 Next Steps

1. Add MongoDB integration for persistent storage
2. Add user authentication (JWT)
3. Add chat history persistence
4. Deploy to production (Heroku, DigitalOcean, etc.)
5. Add more advanced UI features

---

For detailed documentation, see [README.md](README.md)
