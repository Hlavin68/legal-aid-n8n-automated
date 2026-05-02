import axios from 'axios';

export const submitTriage = async (req, res) => {
  try {
    const { caseType, urgency, deadline, description } = req.body;
    const N8N_WEBHOOK_URL_TRIAGE = process.env.N8N_WEBHOOK_URL_TRIAGE;

    if (!N8N_WEBHOOK_URL_TRIAGE) {
      return res.status(500).json({ error: 'N8N_WEBHOOK_URL_TRIAGE not configured' });
    }

    if (!caseType || !urgency || !deadline || !description) {
      return res.status(400).json({ error: 'All triage fields are required' });
    }

    const response = await axios.post(N8N_WEBHOOK_URL_TRIAGE, {
      caseType,
      urgency,
      deadline,
      description
    });

    return res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Triage webhook error:', error.message);
    return res.status(500).json({
      error: 'Failed to send triage request',
      details: error.response?.data || error.message
    });
  }
};
