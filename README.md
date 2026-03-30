# Kenyan Legal AI Assistant - MERN Stack

A full-stack web application providing legal guidance for Kenyan law, powered by AI (n8n + Ollama).

## 🏗️ Project Structure

```
legal-aid/
├── server/                 # Express.js Backend
│   ├── controllers/       # Business logic
│   ├── routes/           # API routes
│   ├── server.js         # Main server file
│   ├── package.json
│   └── .env.example
│
├── client/               # React Frontend
│   ├── public/          # Static files
│   ├── src/
│   │   ├── components/  # Reusable React components
│   │   ├── App.jsx      # Main App component
│   │   └── index.js     # Entry point
│   ├── package.json
│   └── .env.example
│
├── package.json         # Root package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- n8n running locally (for AI processing)

### Installation

1. **Install all dependencies:**

```bash
npm run install-all
```

This will install dependencies for root, server, and client.

2. **Setup environment variables:**

Backend:
```bash
cd server
cp .env.example .env
# Edit .env and update N8N_WEBHOOK_URL if needed
```

Frontend:
```bash
cd ../client
cp .env.example .env
# Edit .env with your backend URL
```

### Running the Application

**Option 1: Run both server and client together**

```bash
npm start
```

This uses `concurrently` to run:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

**Option 2: Run separately**

Terminal 1 (Backend):
```bash
cd server
npm run dev
```

Terminal 2 (Frontend):
```bash
cd client
npm start
```

## 🛠️ API Endpoints

### Chat API

**POST** `/api/chat/send`

Send a message and get a legal response.

Request:
```json
{
  "message": "What are my rights if my employer hasn't paid me?",
  "history": [
    { "role": "user", "content": "..." },
    { "role": "assistant", "content": "..." }
  ]
}
```

Response:
```json
{
  "success": true,
  "response": "Legal guidance based on Kenyan law..."
}
```

### Health Check

**GET** `/health`

Check if the backend is running.

## 📱 Frontend Components

- **Header**: Displays title and subtitle
- **ChatContainer**: Manages message display
- **MessageBubble**: Individual message component
- **InputBox**: User input with send/clear buttons

## ⚙️ Environment Variables

**Server (.env)**
```
PORT=5000
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/legal-assistant
NODE_ENV=development
```

**Client (.env)**
```
REACT_APP_API_URL=http://localhost:5000
```

## 📦 Dependencies

### Backend
- **express**: Web framework
- **cors**: Cross-Origin Resource Sharing
- **dotenv**: Environment variable management
- **axios**: HTTP client for n8n calls

### Frontend
- **react**: UI library
- **react-dom**: React DOM rendering
- **axios**: HTTP client for API calls
- **react-scripts**: Build and dev tools

## 🔄 Workflow

1. User types a legal question in the client
2. React frontend sends message to Express backend
3. Backend calls n8n webhook with the message
4. n8n processes the question with Ollama AI
5. AI response is formatted and returned
6. Frontend displays the response in chat

## 🐛 Troubleshooting

**Backend won't connect to n8n**
- Ensure n8n is running: `n8n start`
- Check n8n webhook URL in `.env`
- Verify firewall settings

**Frontend can't reach backend**
- Check `REACT_APP_API_URL` in client `.env`
- Ensure backend is running on port 5000
- Check CORS settings if running on different domains

**Port already in use**
- Backend: Change `PORT` in `server/.env`
- Frontend: Set `PORT=3001 npm start` in client

## 📝 Scripts

**Root Level**
- `npm start` - Run both server and client
- `npm run server` - Run backend only in dev mode
- `npm run client` - Run frontend only
- `npm run install-all` - Install all dependencies
- `npm run build` - Build client for production

**Backend**
- `npm start` - Run production server
- `npm run dev` - Run with nodemon (auto-reload)

**Frontend**
- `npm start` - Start dev server
- `npm run build` - Create production build
- `npm test` - Run tests
- `npm run eject` - Eject from create-react-app

## 🔐 Security Notes

- Never commit `.env` files
- Use `.env.example` as template
- Keep API keys and secrets in environment variables
- Validate all user inputs on the backend

## 📚 Further Reading

- [Express Documentation](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [n8n Documentation](https://docs.n8n.io/)
- [MongoDB Documentation](https://docs.mongodb.com/)

## 📄 License

ISC

---

**Note**: MongoDB integration (for the "M" in MERN) can be added when implementing user authentication and persistent chat history.
