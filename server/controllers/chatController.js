import axios from 'axios';
import ChatHistory from '../models/ChatHistory.js';

// Send message and save to chat history
export const sendMessage = async (req, res) => {
  try {
    let { message, sessionId } = req.body;
    const userId = req.user?.id;
    const role = req.user?.role || 'client';

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;

    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({
        error: 'N8N_WEBHOOK_URL not configured'
      });
    }

    // 1. Auto-create session if missing
    if (!sessionId) {
      const newSession = new ChatHistory({
        userId,
        userRole: role,
        title: 'New Chat Session'
      });

      await newSession.save();
      sessionId = newSession._id.toString();
    }

    // 2. Ensure session belongs to user
    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized session access' });
    }

    // 3. Clean message
    const cleanMessage = String(message)
      .replace(/^\[(CLIENT|LAWYER) REQUEST\]\s*/i, "")
      .trim();

    const enrichedMessage =
      role === 'lawyer'
        ? `[LAWYER REQUEST] ${cleanMessage}`
        : `[CLIENT REQUEST] ${cleanMessage}`;

    // 4. Call n8n WITH VALID sessionId
    const response = await axios.post(N8N_WEBHOOK_URL, {
      message: enrichedMessage,
      sessionId, // ✅ ALWAYS valid now
      userId,
      userRole: role
    });

    const data = response.data;

    let botResponse =
      data.response ||
      data.output ||
      data.message ||
      data.text ||
      data.content ||
      JSON.stringify(data);

    if (data['1. Situation Summary']) {
      botResponse = formatStructuredResponse(data, role);
    }

    // 5. Save messages properly
    session.addMessage('user', cleanMessage);
    session.addMessage('bot', botResponse);
    await session.save();

    // 6. Return consistent response
    res.json({
      success: true,
      response: botResponse,
      sessionId
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error.message);
    res.status(500).json({
      error: 'Failed to process message',
      details: error.message
    });
  }
};

// Start a new chat session
export const startNewSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'client';
    const { title, caseReference } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = new ChatHistory({
      userId,
      userRole,
      title: title || 'New Chat Session',
      caseReference: caseReference || null
    });

    await session.save();

    res.status(201).json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        createdAt: session.createdAt,
        messageCount: 0,
        messages: []
      }
    });
  } catch (error) {
    console.error('Error creating chat session:', error.message);
    res.status(500).json({
      error: 'Failed to create chat session',
      details: error.message
    });
  }
};

// Get all chat sessions for user
export const getAllSessions = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { archived = false } = req.query;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const sessions = await ChatHistory.find({
      userId,
      isArchived: archived === 'true'
    })
      .select('_id title description userRole messageCount createdAt lastMessageAt tags caseReference')
      .sort({ lastMessageAt: -1 })
      .limit(50);

    res.json({
      success: true,
      sessions,
      total: sessions.length
    });
  } catch (error) {
    console.error('Error fetching sessions:', error.message);
    res.status(500).json({
      error: 'Failed to fetch chat sessions',
      details: error.message
    });
  }
};

// Get specific session with messages
export const getSessionHistory = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        description: session.description,
        messages: session.messages,
        messageCount: session.messageCount,
        userRole: session.userRole,
        createdAt: session.createdAt,
        lastMessageAt: session.lastMessageAt,
        caseReference: session.caseReference,
        tags: session.tags
      }
    });
  } catch (error) {
    console.error('Error fetching session history:', error.message);
    res.status(500).json({
      error: 'Failed to fetch session history',
      details: error.message
    });
  }
};

// Delete entire session
export const deleteSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    await ChatHistory.findByIdAndDelete(sessionId);

    res.json({
      success: true,
      message: 'Session deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting session:', error.message);
    res.status(500).json({
      error: 'Failed to delete session',
      details: error.message
    });
  }
};

// Delete single message from session
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId, messageId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    session.messages = session.messages.filter(msg => msg._id.toString() !== messageId);
    session.messageCount = session.messages.length;
    await session.save();

    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting message:', error.message);
    res.status(500).json({
      error: 'Failed to delete message',
      details: error.message
    });
  }
};

// Archive/Unarchive session
export const toggleArchiveSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    session.isArchived = !session.isArchived;
    await session.save();

    res.json({
      success: true,
      isArchived: session.isArchived,
      message: `Session ${session.isArchived ? 'archived' : 'unarchived'}`
    });
  } catch (error) {
    console.error('Error toggling archive:', error.message);
    res.status(500).json({
      error: 'Failed to toggle archive',
      details: error.message
    });
  }
};

// Update session title and description
export const updateSession = async (req, res) => {
  try {
    const userId = req.user?.id;
    const { sessionId } = req.params;
    const { title, description, tags } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const session = await ChatHistory.findById(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (session.userId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized access to this session' });
    }

    if (title) session.title = title;
    if (description !== undefined) session.description = description;
    if (tags) session.tags = tags;

    await session.save();

    res.json({
      success: true,
      session: {
        id: session._id,
        title: session.title,
        description: session.description,
        tags: session.tags
      }
    });
  } catch (error) {
    console.error('Error updating session:', error.message);
    res.status(500).json({
      error: 'Failed to update session',
      details: error.message
    });
  }
};

// Format structured n8n response based on user role
const formatStructuredResponse = (data, role = 'client') => {
  let formatted = "";
  
  if (data['1. Situation Summary']) {
    formatted += `📋 Situation Summary\n${data['1. Situation Summary']}\n\n`;
  }
  
  if (role === 'lawyer') {
    // Lawyer gets more detailed sections
    if (data['2. Your Legal Rights']) {
      const rights = Array.isArray(data['2. Your Legal Rights']) 
        ? data['2. Your Legal Rights'].join('\n• ')
        : data['2. Your Legal Rights'];
      formatted += `⚖️ Legal Analysis\n• ${rights}\n\n`;
    }
    if (data['3. What You Should Do (Step-by-Step)']) {
      const steps = Array.isArray(data['3. What You Should Do (Step-by-Step)']) 
        ? data['3. What You Should Do (Step-by-Step)'].map((s, i) => `${i+1}. ${s}`).join('\n')
        : data['3. What You Should Do (Step-by-Step)'];
      formatted += `📋 Recommended Actions\n${steps}\n\n`;
    }
    if (data['4. Case Updates']) {
      formatted += `📊 Case Management\n${typeof data['4. Case Updates'] === 'string' ? data['4. Case Updates'] : JSON.stringify(data['4. Case Updates'], null, 2)}\n\n`;
    }
  } else {
    // Client gets simplified guidance
    if (data['2. Your Legal Rights']) {
      const rights = Array.isArray(data['2. Your Legal Rights']) 
        ? data['2. Your Legal Rights'].join('\n• ')
        : data['2. Your Legal Rights'];
      formatted += `⚖️ Your Legal Rights\n• ${rights}\n\n`;
    }
    if (data['3. What You Should Do (Step-by-Step)']) {
      const steps = Array.isArray(data['3. What You Should Do (Step-by-Step)']) 
        ? data['3. What You Should Do (Step-by-Step)'].map((s, i) => `${i+1}. ${s}`).join('\n')
        : data['3. What You Should Do (Step-by-Step)'];
      formatted += `📝 What You Should Do\n${steps}\n\n`;
    }
  }
  
  if (data['4. Where to Get Help']) {
    const help = Array.isArray(data['4. Where to Get Help'])
      ? data['4. Where to Get Help'].join('\n• ')
      : data['4. Where to Get Help'];
    formatted += `🤝 Where to Get Help\n• ${help}\n\n`;
  }
  if (data['5. Relevant Law']) {
    const laws = Array.isArray(data['5. Relevant Law'])
      ? data['5. Relevant Law'].join('\n• ')
      : data['5. Relevant Law'];
    formatted += `📚 Relevant Law\n• ${laws}\n\n`;
  }
  if (data['6. Important Note']) {
    const notes = Array.isArray(data['6. Important Note'])
      ? data['6. Important Note'].join('\n• ')
      : data['6. Important Note'];
    formatted += `⚠️ Important Note\n• ${notes}`;
  }

  return formatted || 'Your question has been processed. Please contact a legal professional for specific advice.';
};
