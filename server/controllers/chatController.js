import axios from 'axios';

export const sendMessage = async (req, res) => {
  try {
    const { message, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
    
    if (!N8N_WEBHOOK_URL) {
      return res.status(500).json({ 
        error: 'N8N_WEBHOOK_URL not configured',
        hint: 'Check server/.env file' 
      });
    }

    // Call n8n webhook
    const response = await axios.post(N8N_WEBHOOK_URL, {
      message,
      history: history || []
    });

    const data = response.data;

    // Extract response from different possible formats
    let botResponse = 
      data.response || 
      data.output || 
      data.message || 
      data.text || 
      data.content || 
      JSON.stringify(data);

    // Handle structured responses
    if (data['1. Situation Summary']) {
      botResponse = formatStructuredResponse(data);
    }

    res.json({ 
      success: true,
      response: botResponse 
    });

  } catch (error) {
    console.error('Error calling n8n webhook:', error.message);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error.message 
    });
  }
};

// Format structured n8n response
const formatStructuredResponse = (data) => {
  let formatted = "";
  
  if (data['1. Situation Summary']) {
    formatted += `📋 Situation Summary\n${data['1. Situation Summary']}\n\n`;
  }
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
