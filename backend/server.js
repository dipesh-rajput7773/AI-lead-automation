import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const LEADS_FILE = path.join(__dirname, 'leads_db.json');
const SETTINGS_FILE = path.join(__dirname, 'settings.json');

// Initialize database files if they don't exist
async function initDB() {
  try {
    await fs.access(LEADS_FILE);
  } catch {
    await fs.writeFile(LEADS_FILE, JSON.stringify([], null, 2));
  }

  try {
    await fs.access(SETTINGS_FILE);
  } catch {
    const defaultSettings = {
      geminiApiKey: process.env.GEMINI_API_KEY || '',
      slackWebhookUrl: process.env.SLACK_WEBHOOK_URL || '',
      googleSheetUrl: process.env.GOOGLE_SHEET_WEBHOOK_URL || '',
      emailReceiver: process.env.EMAIL_RECEIVER || 'sales@example.com',
    };
    await fs.writeFile(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 2));
  }
}

// Helper to read leads
async function readLeads() {
  const data = await fs.readFile(LEADS_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper to write leads
async function writeLeads(leads) {
  await fs.writeFile(LEADS_FILE, JSON.stringify(leads, null, 2));
}

// Helper to read settings
async function readSettings() {
  const data = await fs.readFile(SETTINGS_FILE, 'utf8');
  return JSON.parse(data);
}

// Helper to write settings
async function writeSettings(settings) {
  await fs.writeFile(SETTINGS_FILE, JSON.stringify(settings, null, 2));
}

// Mock AI analysis for fallback
function mockAIAnalysis(lead) {
  const { name, company, budget, message, companySize } = lead;

  // Basic scoring logic
  let score = 50;
  if (budget.includes('$10k+')) score += 30;
  else if (budget.includes('$5k-$10k')) score += 20;
  else if (budget.includes('$1k-$5k')) score += 10;
  else if (budget.includes('<$1k')) score -= 15;

  if (companySize.includes('500+')) score += 15;
  else if (companySize.includes('100-500')) score += 10;
  else if (companySize.includes('10-50')) score += 5;

  // Keyword-based analysis
  const lowerMsg = message.toLowerCase();
  const painPoints = [];
  let summary = `Lead from ${name} at ${company} interested in our services.`;
  let category = 'SMB';
  let suggestedAction = 'Schedule introductory call and share portfolio.';

  if (lowerMsg.includes('scale') || lowerMsg.includes('growth') || lowerMsg.includes('traffic')) {
    painPoints.push('Scaling Operations');
  }
  if (lowerMsg.includes('automate') || lowerMsg.includes('manual') || lowerMsg.includes('time')) {
    painPoints.push('Manual Process Overhead');
    summary = `${name} wants to automate manual workflows to save time.`;
    suggestedAction = 'Prepare a custom automation demo highlighting saved hours.';
  }
  if (lowerMsg.includes('cost') || lowerMsg.includes('expensive') || lowerMsg.includes('budget')) {
    painPoints.push('Cost Optimization');
  }
  if (lowerMsg.includes('security') || lowerMsg.includes('compliant') || lowerMsg.includes('leak')) {
    painPoints.push('Security / Compliance');
  }

  if (painPoints.length === 0) {
    painPoints.push('Business Automation');
  }

  if (score >= 80) {
    category = 'Enterprise';
    suggestedAction = 'VIP follow-up: Send calendar invite for discovery call immediately.';
  } else if (score >= 60) {
    category = 'Mid-Market';
    suggestedAction = 'Send automated email template with case studies.';
  } else if (score < 40) {
    category = 'Low Priority / Spam';
    suggestedAction = 'Auto-respond with resources, monitor response.';
  }

  return {
    summary,
    score: Math.min(Math.max(score, 0), 100),
    category,
    painPoints,
    suggestedAction
  };
}

// GET all leads
app.get('/api/leads', async (req, res) => {
  try {
    const leads = await readLeads();
    // Sort leads by timestamp descending
    leads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    res.json(leads);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read leads database' });
  }
});

// GET current settings (masked)
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await readSettings();
    const maskedSettings = {
      geminiApiKey: settings.geminiApiKey ? '••••••••' + settings.geminiApiKey.slice(-4) : '',
      slackWebhookUrl: settings.slackWebhookUrl ? '••••••••' + settings.slackWebhookUrl.slice(-8) : '',
      googleSheetUrl: settings.googleSheetUrl ? '••••••••' + settings.googleSheetUrl.slice(-8) : '',
      emailReceiver: settings.emailReceiver || '',
    };
    res.json(maskedSettings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings' });
  }
});

// POST update settings
app.get('/api/settings/raw', async (req, res) => {
  // Auxiliary endpoint to check if keys exist (not sending full keys for security)
  try {
    const settings = await readSettings();
    res.json({
      hasGemini: !!settings.geminiApiKey,
      hasSlack: !!settings.slackWebhookUrl,
      hasGoogleSheet: !!settings.googleSheetUrl,
      emailReceiver: settings.emailReceiver
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to read settings status' });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const newSettings = req.body;
    const currentSettings = await readSettings();

    // Only update fields if they are not masked representations
    const updatedSettings = {
      geminiApiKey: newSettings.geminiApiKey && !newSettings.geminiApiKey.startsWith('••••') ? newSettings.geminiApiKey : currentSettings.geminiApiKey,
      slackWebhookUrl: newSettings.slackWebhookUrl && !newSettings.slackWebhookUrl.startsWith('••••') ? newSettings.slackWebhookUrl : currentSettings.slackWebhookUrl,
      googleSheetUrl: newSettings.googleSheetUrl && !newSettings.googleSheetUrl.startsWith('••••') ? newSettings.googleSheetUrl : currentSettings.googleSheetUrl,
      emailReceiver: newSettings.emailReceiver || currentSettings.emailReceiver,
    };

    await writeSettings(updatedSettings);
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// POST submit a lead and trigger automation pipeline
app.post('/api/leads', async (req, res) => {
  const leadData = req.body;
  const timestamp = new Date().toISOString();
  const leadId = 'lead_' + Math.random().toString(36).substr(2, 9);

  const lead = {
    id: leadId,
    timestamp,
    ...leadData,
    automationLogs: [],
    status: 'processing'
  };

  const addLog = (step, status, message, details = null) => {
    lead.automationLogs.push({
      step,
      status, // 'running', 'success', 'failed'
      message,
      timestamp: new Date().toISOString(),
      details
    });
  };

  // Add initial log
  addLog('form_receive', 'success', 'Lead captured from frontend form.');

  const settings = await readSettings();

  // Step 1: AI Summary & Scoring
  addLog('ai_processing', 'running', 'Analyzing lead details with AI...');

  let aiResult;
  let usedRealAI = false;

  if (settings.geminiApiKey) {
    try {
      const prompt = `
      You are an AI sales assistant. Analyze this new sales lead and return a JSON object.
      Lead Details:
      - Name: ${lead.name}
      - Email: ${lead.email}
      - Company: ${lead.company}
      - Company Size: ${lead.companySize}
      - Budget Range: ${lead.budget}
      - Message/Requirements: ${lead.message}

      Output JSON Schema:
      {
        "summary": "1-2 sentence concise summary of lead request & paintpoint.",
        "score": number between 0 and 100 (high score for high budget, larger company, clear urgent need),
        "category": "Enterprise" | "Mid-Market" | "SMB" | "Spam" | "Partnership",
        "painPoints": ["painpoint1", "painpoint2"],
        "suggestedAction": "Immediate recommendation for the sales executive."
      }

      Return ONLY raw JSON. No markdown, no triple backticks.
      `;

      const response = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${settings.geminiApiKey}`,
        {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        },
        { headers: { 'Content-Type': 'application/json' } }
      );

      const jsonText = response.data.candidates[0].content.parts[0].text;
      aiResult = JSON.parse(jsonText.trim());
      usedRealAI = true;
      addLog('ai_processing', 'success', 'AI classification completed successfully.', aiResult);
    } catch (error) {
      console.error('Gemini API Error:', error.message);
      addLog('ai_processing', 'failed', `Gemini API failed: ${error.message}. Falling back to rules-based AI.`);
      aiResult = mockAIAnalysis(lead);
    }
  } else {
    // Artificial delay to make simulation feel realistic
    await new Promise(resolve => setTimeout(resolve, 1500));
    aiResult = mockAIAnalysis(lead);
    addLog('ai_processing', 'success', 'AI classification completed (Simulation).', aiResult);
  }

  // Merge AI results
  lead.aiSummary = aiResult.summary;
  lead.leadScore = aiResult.score;
  lead.category = aiResult.category;
  lead.painPoints = aiResult.painPoints;
  lead.suggestedAction = aiResult.suggestedAction;
  lead.usedRealAI = usedRealAI;

  // Step 2: Google Sheets integration
  addLog('google_sheets', 'running', 'Pushing lead record to Google Sheets...');
  let usedRealSheets = false;
  let usedRealEmail = false;

  if (settings.googleSheetUrl) {
    try {
      const sheetPayload = {
        timestamp: lead.timestamp,
        name: lead.name,
        email: lead.email,
        company: lead.company,
        companySize: lead.companySize,
        budget: lead.budget,
        aiSummary: lead.aiSummary,
        leadScore: lead.leadScore,
        category: lead.category,
        suggestedAction: lead.suggestedAction,
        painPoints: lead.painPoints,
        message: lead.message,
        emailReceiver: settings.emailReceiver
      };

      const sheetResponse = await axios.post(settings.googleSheetUrl, sheetPayload, {
        headers: { 'Content-Type': 'application/json' },
        maxRedirects: 10,
      });

      const responsePreview = typeof sheetResponse.data === 'string'
        ? sheetResponse.data.slice(0, 200)
        : JSON.stringify(sheetResponse.data).slice(0, 200);

      if (
        typeof sheetResponse.data === 'string' &&
        /accounts\.google\.com|signin|<!doctype html/i.test(sheetResponse.data)
      ) {
        throw new Error('Google Apps Script returned a sign-in page. Redeploy the web app with access set to "Anyone".');
      }

      let sheetResult = null;
      if (typeof sheetResponse.data === 'string') {
        try {
          sheetResult = JSON.parse(sheetResponse.data);
        } catch {
          sheetResult = null;
        }
      } else {
        sheetResult = sheetResponse.data;
      }
      usedRealEmail = sheetResult?.emailSent === true;

      console.log('Google Sheets response preview:', responsePreview);
      usedRealSheets = true;
      addLog('google_sheets', 'success', 'Data successfully written to Google Sheets row.');
    } catch (error) {
      const status = error.response?.status;
      const sheetsError = status === 401 || status === 403
        ? `Google Apps Script rejected the request (${status}). Redeploy the web app with "Execute as: Me" and "Who has access: Anyone", then paste the /exec URL.`
        : error.message;
      console.error('Google Sheets Error:', sheetsError);
      addLog('google_sheets', 'failed', `Google Sheets failed: ${sheetsError}`);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1200));
    addLog('google_sheets', 'success', 'Data appended to Google Sheet spreadsheet (Simulation).');
  }
  lead.usedRealSheets = usedRealSheets;

  // Step 3: Slack Notification
  addLog('slack_notification', 'running', 'Posting notification to Slack...');
  let usedRealSlack = false;

  if (settings.slackWebhookUrl) {
    try {
      const scoreColor = lead.leadScore >= 75 ? '#2eb886' : lead.leadScore >= 50 ? '#e0a800' : '#a30200';
      const slackPayload = {
        attachments: [
          {
            fallback: `New lead from ${lead.name} (${lead.company})`,
            color: scoreColor,
            pretext: `🚀 *New Lead Captured & AI Analyzed*`,
            author_name: lead.name,
            author_link: `mailto:${lead.email}`,
            title: `${lead.company} - ${lead.category} Lead`,
            text: `*AI Summary:* ${lead.aiSummary}\n*Suggested Action:* ${lead.suggestedAction}`,
            fields: [
              { title: 'Email', value: lead.email, short: true },
              { title: 'Budget', value: lead.budget, short: true },
              { title: 'Company Size', value: lead.companySize, short: true },
              { title: 'Lead Score', value: `*${lead.leadScore}/100*`, short: true },
              { title: 'Pain Points', value: lead.painPoints.join(', '), short: false }
            ],
            footer: 'AI Automation Agent Demo',
            ts: Math.floor(Date.now() / 1000)
          }
        ]
      };

      await axios.post(settings.slackWebhookUrl, slackPayload);
      usedRealSlack = true;
      addLog('slack_notification', 'success', 'Slack webhook notification sent successfully.');
    } catch (error) {
      console.error('Slack Webhook Error:', error.message);
      addLog('slack_notification', 'failed', `Slack post failed: ${error.message}`);
    }
  } else {
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('slack_notification', 'success', 'Slack notification webhook sent (Simulation).');
  }
  lead.usedRealSlack = usedRealSlack;

  // Step 4: Email Notification
  addLog('email_notification', 'running', 'Sending automated email notification...');

  if (usedRealEmail) {
    addLog('email_notification', 'success', `Email notification sent to ${settings.emailReceiver} via Google Apps Script.`);
  } else {
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('email_notification', 'success', `Email notification sent to ${settings.emailReceiver} (Simulation).`);
  }
  lead.usedRealEmail = usedRealEmail;

  lead.status = 'completed';
  addLog('pipeline_complete', 'success', 'Lead automation workflow completed successfully!');

  // Save to db
  const leads = await readLeads();
  leads.push(lead);
  await writeLeads(leads);

  res.json(lead);
});

// Start the database files initialization and then listen
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
  });
}).catch(err => {
  console.error('Database initialization failed:', err);
});
