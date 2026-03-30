# Development Workflow

This MERN application consists of 3 main parts:

## Architecture

```
┌─────────────┐         ┌─────────────┐        ┌──────────────┐
│   React     │         │  Express    │        │   n8n        │
│  Frontend   │◄────────►│  Backend    │◄──────►│  Webhook     │
│  :3000      │         │  :5000      │        │  :5678       │
└─────────────┘         └─────────────┘        └──────────────┘
                             ▲
                             │
                        (will add)
                        MongoDB
```

## Starting Development

### Option A: Full Stack (All in one command)

```bash
npm start
```

This runs:
- Backend on http://localhost:5000
- Frontend on http://localhost:3000

### Option B: Separate Terminals

**Terminal 1 - Backend:**
```bash
cd server
npm run dev
# Watches for changes and restarts automatically
```

**Terminal 2 - Frontend:**
```bash
cd client  
npm start
# Hot reload on file changes
```

**Terminal 3 - n8n (separate from this project):**
```bash
n8n start
```

## API Communication Flow

```
User Input (React)
    ↓
axios POST /api/chat/send
    ↓
Express Backend (chatController)
    ↓
axios POST to n8n webhook
    ↓
n8n processes with Ollama
    ↓
Response back to Express
    ↓
Express formats and returns
    ↓
React displays in Chat
```

## Environment Configuration

### Backend (.env)
```
PORT=5000
N8N_WEBHOOK_URL=http://localhost:5678/webhook-test/legal-assistant
NODE_ENV=development
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
```

## Making Changes

### Backend Changes
- Edit files in `server/`
- Server automatically restarts (nodemon)
- Test with: `curl http://localhost:5000/api/chat/send -X POST ...`

### Frontend Changes
- Edit files in `client/src/`
- Browser automatically refreshes
- Check console for errors (F12)

### Styling
- Component styles in `client/src/components/[Component].css`
- Global styles in `client/src/index.css`

## Debugging

### Backend Debug
```bash
cd server
NODE_DEBUG=* npm run dev
```

### Frontend Debug
- Open DevTools (F12)
- Check Console tab
- Use React DevTools extension

### Check Services
```bash
# Backend health
curl http://localhost:5000/health

# n8n health  
curl http://localhost:5678

# Frontend
Open http://localhost:3000
```

## Git Workflow

```bash
# Stage changes
git add .

# Commit with message
git commit -m "Feature: Add chat functionality"

# Push to repository
git push origin main
```

Files to ignore (already in .gitignore):
- node_modules/
- .env (use .env.example instead)
- build/
- dist/

## Performance Tips

1. **Backend**: Use `npm run dev` during development for auto-reload
2. **Frontend**: React automatically does code splitting
3. **Browser**: Use incognito mode to avoid cache issues
4. **Network**: Check DevTools Network tab for slow requests

## Troubleshooting Common Issues

### "Cannot find module"
```bash
# Reinstall dependencies
npm install
cd server && npm install
cd ../client && npm install
```

### Port already in use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Kill process on port 5000
lsof -ti:5000 | xargs kill -9
```

### Changes not reflecting
```bash
# Hard refresh browser
Ctrl+Shift+R (Windows/Linux)
Cmd+Shift+R (Mac)

# Or clear cache
npm start --reset-cache
```

### CORS errors
- Check backend is running
- Verify REACT_APP_API_URL in client .env
- Ensure n8n webhook URL is correct in server .env

## Next Development Tasks

- [ ] Add database (MongoDB)
- [ ] Add user authentication
- [ ] Add chat history persistence
- [ ] Add error boundaries in React
- [ ] Add API request validation
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Set up CI/CD pipeline

---

**Happy coding!** 🚀
