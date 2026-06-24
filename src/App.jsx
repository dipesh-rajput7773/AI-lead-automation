import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Database, 
  Layers, 
  MessageSquare, 
  Mail, 
  Settings as SettingsIcon, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Send, 
  FileSpreadsheet, 
  Sparkles, 
  ExternalLink, 
  Clock, 
  Building, 
  DollarSign, 
  Users, 
  X, 
  Check, 
  Copy, 
  ChevronDown, 
  ChevronUp, 
  Info,
  Zap,
  ArrowRight
} from 'lucide-react';

// Alias for Slack icon
const Slack = MessageSquare;

const DEMO_TEMPLATES = [
  {
    label: "🔥 Enterprise Lead",
    name: "Alexander Wright",
    email: "a.wright@novatech.com",
    company: "NovaTech Solutions",
    companySize: "500+",
    budget: "$10,000+",
    message: "We are looking for an enterprise-grade AI solution to sync our customer inquiries directly into our Salesforce CRM, auto-assign lead scores, generate summaries, and notify our executive Slack channel immediately. We expect around 5,000 leads per month."
  },
  {
    label: "⚡ Mid-Market Lead",
    name: "Sarah Jenkins",
    email: "sarah.j@growthlabs.io",
    company: "GrowthLabs",
    companySize: "50-100",
    budget: "$5,000 - $10,000",
    message: "Our sales team is wasting too much time copying lead details into Google Sheets and writing Slack notifications. We need a reliable automation that does this instantly and sends a customized summary to our email inbox."
  },
  {
    label: "🍞 Small Business Lead",
    name: "David Miller",
    email: "miller.bakes@gmail.com",
    company: "Miller's Bakery",
    companySize: "1-10",
    budget: "< $1,000",
    message: "Hi, I just want a simple form on my website that sends me an email when someone wants to order a custom cake. Nothing too fancy."
  },
  {
    label: "⚠️ Spam Bot",
    name: "John Crypt",
    email: "crypto-riches-now@spambot.info",
    company: "DeFi Wealth Master",
    companySize: "1-10",
    budget: "< $1,000",
    message: "🚀 INVEST IN CRYPTO NOW!!! 1000% RETURNS GUARANTEED!!! CLICK HERE FOR RICHES!!! NO RISK!!! 🚀"
  }
];

export default function App() {
  const [leads, setLeads] = useState([]);
  const [settings, setSettings] = useState({
    geminiApiKey: '',
    slackWebhookUrl: '',
    googleSheetUrl: '',
    emailReceiver: 'sales@example.com'
  });
  const [apiStatus, setApiStatus] = useState({
    hasGemini: false,
    hasSlack: false,
    hasGoogleSheet: false,
    emailReceiver: ''
  });
  
  const [activeTab, setActiveTab] = useState('crm'); // crm, sheets, slack
  const [showSettings, setShowSettings] = useState(false);
  const [expandedLead, setExpandedLead] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    companySize: '10-50',
    budget: '$1,000 - $5,000',
    message: ''
  });
  
  // Pipeline State
  const [isProcessing, setIsProcessing] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(null); // form_receive, ai_processing, google_sheets, slack_notification, email_notification, pipeline_complete
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [processedLead, setProcessedLead] = useState(null);

  // Settings Save State
  const [settingsForm, setSettingsForm] = useState({
    geminiApiKey: '',
    slackWebhookUrl: '',
    googleSheetUrl: '',
    emailReceiver: ''
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const logsEndRef = useRef(null);

  // Fetch leads and settings
  const fetchData = async () => {
    try {
      const leadsRes = await fetch('/api/leads');
      if (leadsRes.ok) {
        const leadsData = await leadsRes.json();
        setLeads(leadsData);
      }
      
      const settingsRes = await fetch('/api/settings');
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);
        setSettingsForm(settingsData);
      }

      const statusRes = await fetch('/api/settings/raw');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setApiStatus(statusData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scroll logs to bottom
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [pipelineLogs]);

  // Apply Quick-Fill Template
  const handleApplyTemplate = (template) => {
    setFormData({
      name: template.name,
      email: template.email,
      company: template.company,
      companySize: template.companySize,
      budget: template.budget,
      message: template.message
    });
  };

  // Form Submit Handler
  const handleSubmitLead = async (e) => {
    e.preventDefault();
    if (isProcessing) return;

    setIsProcessing(true);
    setProcessedLead(null);
    setPipelineStep('form_receive');
    
    const logs = [
      { step: 'form_receive', status: 'success', message: 'Lead captured from frontend form.', timestamp: new Date().toLocaleTimeString() }
    ];
    setPipelineLogs(logs);
    const timers = [];

    // AI simulation delay
    timers.push(setTimeout(() => {
      setPipelineStep('ai_processing');
      setPipelineLogs(prev => [
        ...prev,
        { step: 'ai_processing', status: 'running', message: apiStatus.hasGemini ? 'Analyzing lead with Gemini 2.5 Flash API...' : 'Analyzing lead with Local AI (Simulation)...', timestamp: new Date().toLocaleTimeString() }
      ]);
    }, 800));

    // Sheets simulation delay
    timers.push(setTimeout(() => {
      setPipelineLogs(prev => {
        const updated = [...prev];
        updated[1] = { ...updated[1], status: 'success', message: apiStatus.hasGemini ? 'Gemini AI analysis and categorization completed.' : 'Local AI analysis and categorization completed.' };
        return [
          ...updated,
          { step: 'google_sheets', status: 'running', message: apiStatus.hasGoogleSheet ? 'Sending row payload to Google Sheets Webhook...' : 'Pushing row to Google Sheet spreadsheet (Simulation)...', timestamp: new Date().toLocaleTimeString() }
        ];
      });
      setPipelineStep('google_sheets');
    }, 2500));

    // Slack simulation delay
    timers.push(setTimeout(() => {
      setPipelineLogs(prev => {
        const updated = [...prev];
        updated[3] = { ...updated[3], status: 'running', message: apiStatus.hasGoogleSheet ? 'Waiting for Google Sheets webhook response...' : 'Pushing row to Google Sheet spreadsheet (Simulation).' };
        return [
          ...updated,
          { step: 'slack_notification', status: 'running', message: apiStatus.hasSlack ? 'Triggering Slack Incoming Webhook...' : 'Sending Slack notification block (Simulation)...', timestamp: new Date().toLocaleTimeString() }
        ];
      });
      setPipelineStep('slack_notification');
    }, 3800));

    // Email simulation delay
    timers.push(setTimeout(() => {
      setPipelineLogs(prev => {
        const updated = [...prev];
        updated[5] = { ...updated[5], status: 'success', message: apiStatus.hasSlack ? 'Slack webhook notification posted successfully.' : 'Slack channel notification sent (Simulation).' };
        return [
          ...updated,
          { step: 'email_notification', status: 'running', message: `Sending automated email to admin (${apiStatus.emailReceiver || 'sales@example.com'})...`, timestamp: new Date().toLocaleTimeString() }
        ];
      });
      setPipelineStep('email_notification');
    }, 4800));

    // Complete simulation delay
    timers.push(setTimeout(() => {
      setPipelineLogs(prev => {
        const updated = [...prev];
        updated[7] = { ...updated[7], status: 'success', message: `Email delivered successfully.` };
        return [
          ...updated,
          { step: 'pipeline_complete', status: 'success', message: 'Lead automation pipeline complete!', timestamp: new Date().toLocaleTimeString() }
        ];
      });
      setPipelineStep('pipeline_complete');
    }, 5600));

    try {
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const newLead = await response.json();
        timers.forEach(clearTimeout);
        const serverLogs = (newLead.automationLogs || []).map(log => ({
          ...log,
          timestamp: new Date(log.timestamp).toLocaleTimeString()
        }));
        const failedLog = serverLogs.find(log => log.status === 'failed');
        const lastLog = serverLogs[serverLogs.length - 1];
        
        setTimeout(() => {
          setPipelineLogs(serverLogs);
          setPipelineStep(failedLog?.step || lastLog?.step || 'pipeline_complete');
          setProcessedLead(newLead);
          setLeads(prev => [newLead, ...prev]);
          setIsProcessing(false);
          // Reset form fields
          setFormData({
            name: '',
            email: '',
            company: '',
            companySize: '10-50',
            budget: '$1,000 - $5,000',
            message: ''
          });
        }, 300);
      } else {
        timers.forEach(clearTimeout);
        setIsProcessing(false);
        alert("Failed to submit lead to backend");
      }
    } catch (error) {
      timers.forEach(clearTimeout);
      console.error(error);
      setIsProcessing(false);
      alert("Error submitting lead");
    }
  };

  // Settings Save Handler
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setIsSavingSettings(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsForm)
      });
      if (res.ok) {
        setSaveSuccess(true);
        fetchData();
        setTimeout(() => setSaveSuccess(false), 3000);
      } else {
        alert("Failed to save settings");
      }
    } catch (e) {
      console.error(e);
      alert("Error saving settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const getPriorityBadge = (score) => {
    if (score >= 80) return <span className="badge badge-rose">High Priority</span>;
    if (score >= 50) return <span className="badge badge-amber">Medium</span>;
    return <span className="badge badge-blue">Low</span>;
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'Enterprise': return <span className="badge badge-purple">Enterprise</span>;
      case 'Mid-Market': return <span className="badge badge-blue">Mid-Market</span>;
      case 'SMB': return <span className="badge badge-green">SMB</span>;
      case 'Spam': return <span className="badge badge-rose">Spam Bot</span>;
      default: return <span className="badge badge-amber">{category}</span>;
    }
  };

  const getScorePill = (score) => {
    if (score >= 80) return <div className="score-pill score-high">{score}</div>;
    if (score >= 50) return <div className="score-pill score-medium">{score}</div>;
    return <div className="score-pill score-low">{score}</div>;
  };

  const formatDate = (isoString) => {
    const d = new Date(isoString);
    return `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* App Header */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">
            <Zap size={22} fill="white" />
          </div>
          <div>
            <h1 className="brand-title" style={{ margin: 0, fontSize: '22px', letterSpacing: '-0.5px' }}>
              LeadFlow <span className="text-gradient">AI</span>
            </h1>
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', textAlign: 'left', fontWeight: '500' }}>
              AI Lead Capture & Automation Pipeline
            </p>
          </div>
        </div>

        <div className="nav-buttons">
          <button className="nav-btn" onClick={() => setShowSettings(true)}>
            <SettingsIcon size={16} />
            <span>Integrations</span>
            {(apiStatus.hasGemini || apiStatus.hasSlack || apiStatus.hasGoogleSheet) && (
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--color-success)', display: 'inline-block' }}></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Split Layout */}
      <main className="main-container">
        
        {/* Left Panel: Public Lead Form & Live Pipeline */}
        <section className="glass-card lead-form-panel animate-slide-in">
          <div className="panel-title">
            <Sparkles size={20} className="text-gradient" />
            <h2>Lead Capture & AI Pipeline</h2>
          </div>
          
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px' }}>
            Submit a lead below to watch the automation trigger in real-time. Use quick-fill templates to test different AI routing conditions.
          </p>

          {/* Quick Fill Templates */}
          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-dim)', display: 'block', marginBottom: '10px', letterSpacing: '0.5px' }}>
              ⚡ Quick-Fill Demo Templates:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {DEMO_TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="nav-btn"
                  onClick={() => handleApplyTemplate(tmpl)}
                  style={{ fontSize: '12px', padding: '6px 12px' }}
                  disabled={isProcessing}
                >
                  {tmpl.label}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmitLead} className="lead-form-container">
            <div className="form-row">
              <div className="form-group">
                <label>Contact Name</label>
                <input
                  type="text"
                  required
                  placeholder="Enter name"
                  className="input-field"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  className="input-field"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Company Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  className="input-field"
                  value={formData.company}
                  onChange={(e) => setFormData({...formData, company: e.target.value})}
                  disabled={isProcessing}
                />
              </div>
              <div className="form-group">
                <label>Company Size</label>
                <select
                  className="input-field"
                  value={formData.companySize}
                  onChange={(e) => setFormData({...formData, companySize: e.target.value})}
                  disabled={isProcessing}
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="10-50">10-50 employees</option>
                  <option value="50-100">50-100 employees</option>
                  <option value="100-500">100-500 employees</option>
                  <option value="500+">500+ employees</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Estimated Project Budget (Monthly)</label>
              <select
                className="input-field"
                value={formData.budget}
                onChange={(e) => setFormData({...formData, budget: e.target.value})}
                disabled={isProcessing}
              >
                <option value="<$1,000">&lt; $1,000 / mo</option>
                <option value="$1,000 - $5,000">$1,000 - $5,000 / mo</option>
                <option value="$5,000 - $10,000">$5,000 - $10,000 / mo</option>
                <option value="$10,000+">$10,000+ / mo</option>
              </select>
            </div>

            <div className="form-group">
              <label>Tell us about your requirements</label>
              <textarea
                required
                placeholder="What services or automation do you need help with?"
                className="input-field"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                disabled={isProcessing}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <Loader2 className="animate-spin" size={18} style={{ animation: 'rotate 1s linear infinite' }} />
                  <span>Processing Lead Automation Pipeline...</span>
                </>
              ) : (
                <>
                  <Send size={16} />
                  <span>Submit Lead Inquiry</span>
                </>
              )}
            </button>
          </form>

          {/* Pipeline Visualizer Overlay/Section */}
          {(isProcessing || processedLead) && (
            <div className="pipeline-visualizer animate-slide-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Automation Pipeline Execution
                </h3>
                {isProcessing ? (
                  <span className="badge badge-purple animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <Loader2 size={12} style={{ animation: 'rotate 1s linear infinite' }} /> Active
                  </span>
                ) : (
                  <span className="badge badge-green" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CheckCircle2 size={12} /> Complete
                  </span>
                )}
              </div>

              {/* Progress node line */}
              <div className="pipeline-nodes">
                <div 
                  className={`pipeline-node ${pipelineStep === 'form_receive' ? 'active' : 'success'}`}
                  style={{ '--node-color': 'var(--color-primary)', '--node-glow': 'var(--color-primary-glow)' }}
                  title="Form Captured"
                >
                  <Send size={18} />
                </div>
                <div 
                  className={`pipeline-node ${
                    pipelineStep === 'ai_processing' ? 'active' : 
                    ['google_sheets', 'slack_notification', 'email_notification', 'pipeline_complete'].includes(pipelineStep) ? 'success' : ''
                  }`}
                  style={{ '--node-color': 'var(--color-primary)', '--node-glow': 'var(--color-primary-glow)' }}
                  title="AI Summarization"
                >
                  <Bot size={18} />
                </div>
                <div 
                  className={`pipeline-node ${
                    pipelineStep === 'google_sheets' ? 'active' : 
                    ['slack_notification', 'email_notification', 'pipeline_complete'].includes(pipelineStep) ? 'success' : ''
                  }`}
                  style={{ '--node-color': 'var(--color-success)', '--node-glow': 'var(--color-success-glow)' }}
                  title="Google Sheets"
                >
                  <FileSpreadsheet size={18} />
                </div>
                <div 
                  className={`pipeline-node ${
                    pipelineStep === 'slack_notification' ? 'active' : 
                    ['email_notification', 'pipeline_complete'].includes(pipelineStep) ? 'success' : ''
                  }`}
                  style={{ '--node-color': 'var(--color-slack)', '--node-glow': 'var(--color-slack-glow)' }}
                  title="Slack Notification"
                >
                  <Slack size={18} />
                </div>
                <div 
                  className={`pipeline-node ${
                    pipelineStep === 'email_notification' ? 'active' : 
                    pipelineStep === 'pipeline_complete' ? 'success' : ''
                  }`}
                  style={{ '--node-color': 'var(--color-email)', '--node-glow': 'var(--color-email-glow)' }}
                  title="Email Dispatcher"
                >
                  <Mail size={18} />
                </div>
              </div>

              {/* Log box */}
              <div className="timeline-logs">
                {pipelineLogs.map((log, index) => (
                  <div key={index} className="log-item">
                    <span className={`log-status-dot ${log.status}`}></span>
                    <span className="log-time">[{log.timestamp}]</span>
                    <span className="log-msg">{log.message}</span>
                  </div>
                ))}
                <div ref={logsEndRef}></div>
              </div>
            </div>
          )}
        </section>

        {/* Right Panel: Integrated CRM / Spreadsheet / Slack Hub */}
        <section className="glass-card admin-dashboard-panel animate-slide-in">
          <div className="dashboard-tabs">
            <button 
              className={`tab-btn ${activeTab === 'crm' ? 'active' : ''}`}
              onClick={() => setActiveTab('crm')}
            >
              <Database size={16} />
              <span>CRM Database</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'sheets' ? 'active' : ''}`}
              onClick={() => setActiveTab('sheets')}
            >
              <FileSpreadsheet size={16} />
              <span>Google Sheet</span>
            </button>
            <button 
              className={`tab-btn ${activeTab === 'slack' ? 'active' : ''}`}
              onClick={() => setActiveTab('slack')}
            >
              <Slack size={16} />
              <span>Slack Workspace</span>
            </button>
          </div>

          {/* CRM Lead Table */}
          {activeTab === 'crm' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Incoming Sales Leads</h3>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Total: {leads.length} leads
                </span>
              </div>

              {leads.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)', border: '1px dashed var(--border-color)', borderRadius: '12px' }}>
                  <Database size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p style={{ fontWeight: '500' }}>No leads in database yet</p>
                  <p style={{ fontSize: '13px' }}>Submit the form on the left to populate the CRM.</p>
                </div>
              ) : (
                <div className="leads-table-container">
                  <table className="leads-table">
                    <thead>
                      <tr>
                        <th>Lead Info</th>
                        <th>AI Score</th>
                        <th>Category</th>
                        <th>Date</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leads.map((lead) => (
                        <React.Fragment key={lead.id}>
                          <tr 
                            style={{ cursor: 'pointer', background: expandedLead === lead.id ? 'rgba(255,255,255,0.02)' : '' }}
                            onClick={() => setExpandedLead(expandedLead === lead.id ? null : lead.id)}
                          >
                            <td>
                              <div style={{ fontWeight: '600', color: 'white' }}>{lead.name}</div>
                              <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{lead.company} ({lead.companySize})</div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {getScorePill(lead.leadScore)}
                                {getPriorityBadge(lead.leadScore)}
                              </div>
                            </td>
                            <td>{getCategoryBadge(lead.category)}</td>
                            <td style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                              {formatDate(lead.timestamp)}
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                style={{ background: 'transparent', border: 'none', color: 'var(--color-primary)', cursor: 'pointer' }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedLead(expandedLead === lead.id ? null : lead.id);
                                }}
                              >
                                {expandedLead === lead.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Details Row */}
                          {expandedLead === lead.id && (
                            <tr>
                              <td colSpan="5" style={{ padding: '0 16px 16px', background: 'rgba(10, 14, 26, 0.3)' }}>
                                <div className="lead-detail-expanded animate-slide-in">
                                  <div>
                                    <div style={{ marginBottom: '12px' }}>
                                      <div className="expanded-section-title">AI Summary & Pain Points</div>
                                      <p style={{ fontSize: '14px', color: 'white', fontWeight: '500', marginBottom: '8px', lineHeight: '1.4' }}>
                                        {lead.aiSummary}
                                      </p>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                        {lead.painPoints.map((pt, i) => (
                                          <span key={i} className="badge badge-purple" style={{ fontSize: '10px', padding: '2px 8px' }}>
                                            {pt}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    <div>
                                      <div className="expanded-section-title">Original Message</div>
                                      <p style={{ fontSize: '13px', color: 'var(--text-muted)', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                                        "{lead.message}"
                                      </p>
                                    </div>
                                  </div>

                                  <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '15px' }}>
                                    <div style={{ marginBottom: '12px' }}>
                                      <div className="expanded-section-title">Contact Info</div>
                                      <p style={{ fontSize: '13px', color: 'white', fontWeight: '500' }}>{lead.email}</p>
                                      <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Budget: {lead.budget}</p>
                                    </div>

                                    <div style={{ marginBottom: '12px' }}>
                                      <div className="expanded-section-title">Suggested Next Action</div>
                                      <p style={{ fontSize: '13px', color: 'var(--color-success)', fontWeight: '600', lineHeight: '1.3' }}>
                                        {lead.suggestedAction}
                                      </p>
                                    </div>

                                    <div>
                                      <div className="expanded-section-title">API Execution Mode</div>
                                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                                        Gemini: {lead.usedRealAI ? '🟢 Real API' : '⚪ Simulated'}<br/>
                                        Sheets: {lead.usedRealSheets ? '🟢 Real Hook' : '⚪ Simulated'}<br/>
                                        Slack: {lead.usedRealSlack ? '🟢 Real Hook' : '⚪ Simulated'}<br/>
                                        Email: {lead.usedRealEmail ? '🟢 Real Mail' : '⚪ Simulated'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Google Sheets Mockup View */}
          {activeTab === 'sheets' && (
            <div className="sheets-preview">
              <div className="sheets-header">
                <div className="sheets-title-container">
                  <div style={{ width: '28px', height: '28px', borderRadius: '6px', background: '#0f9d58', display: 'flex', alignItems: 'center', justifycontent: 'center', color: 'white', fontWeight: 'bold' }}>
                    田
                  </div>
                  <div>
                    <h4 style={{ fontSize: '13px', fontWeight: '600', color: '#f1f5f9' }}>Inbound_Leads_CRM_Sync</h4>
                    <p style={{ fontSize: '10px', color: '#64748b', textAlign: 'left' }}>
                      {apiStatus.hasGoogleSheet ? '🟢 Real-time Sheet webhook sync connected' : '⚪ Sheet mockup simulation active'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <div style={{ background: '#334155', height: '8px', width: '40px', borderRadius: '4px' }}></div>
                  <div style={{ background: '#334155', height: '8px', width: '60px', borderRadius: '4px' }}></div>
                </div>
              </div>

              <div className="sheets-grid">
                <table className="sheets-table">
                  <thead>
                    <tr>
                      <th></th>
                      <th>Timestamp</th>
                      <th>Lead Name</th>
                      <th>Email</th>
                      <th>Company</th>
                      <th>Budget</th>
                      <th>Lead Score</th>
                      <th>AI Summary</th>
                      <th>Category</th>
                      <th>Suggested Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, idx) => (
                      <tr key={lead.id}>
                        <td style={{ background: '#1e293b', color: '#64748b', textAlign: 'center', fontWeight: 'bold', width: '30px' }}>
                          {leads.length - idx}
                        </td>
                        <td>{formatDate(lead.timestamp)}</td>
                        <td style={{ color: '#10b981', fontWeight: '500' }}>{lead.name}</td>
                        <td>{lead.email}</td>
                        <td>{lead.company}</td>
                        <td>{lead.budget}</td>
                        <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{lead.leadScore}</td>
                        <td>{lead.aiSummary}</td>
                        <td>{lead.category}</td>
                        <td>{lead.suggestedAction}</td>
                      </tr>
                    ))}
                    {/* Add some empty rows to make it look like a real spreadsheet */}
                    {Array.from({ length: Math.max(0, 12 - leads.length) }).map((_, idx) => (
                      <tr key={`empty-${idx}`}>
                        <td style={{ background: '#1e293b', color: '#64748b', textAlign: 'center', fontWeight: 'bold', width: '30px' }}>
                          {Math.max(0, 12 - leads.length) - idx + leads.length}
                        </td>
                        {Array.from({ length: 9 }).map((_, cIdx) => (
                          <td key={cIdx}></td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Slack Workspace Preview */}
          {activeTab === 'slack' && (
            <div className="slack-preview">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid #30363d', paddingBottom: '12px' }}>
                <Slack size={18} color="#ec4899" />
                <div>
                  <h4 style={{ fontSize: '14px', fontWeight: '900', color: 'white' }}>#inbound-leads</h4>
                  <p style={{ fontSize: '11px', color: '#8b8d90', textAlign: 'left' }}>
                    {apiStatus.hasSlack ? '🟢 Real Slack webhook notification active' : '⚪ Simulated notification channel'}
                  </p>
                </div>
              </div>

              {leads.length === 0 ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#8b8d90' }}>
                  <Slack size={36} style={{ opacity: 0.3, marginBottom: '10px' }} />
                  <p style={{ fontSize: '13px' }}>Channel is quiet. Submit a lead to trigger a notification.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {leads.map((lead) => {
                    const scoreColor = lead.leadScore >= 80 ? '#ef4444' : lead.leadScore >= 50 ? '#f59e0b' : '#3b82f6';
                    return (
                      <div key={lead.id} className="slack-msg-item">
                        <div className="slack-avatar">LF</div>
                        <div className="slack-msg-body">
                          <div className="slack-msg-meta">
                            <span className="slack-username">LeadFlow AI App</span>
                            <span className="badge badge-purple" style={{ fontSize: '9px', padding: '1px 5px' }}>APP</span>
                            <span className="slack-time">{formatDate(lead.timestamp)}</span>
                          </div>
                          
                          <p style={{ color: '#d1d2d3', fontSize: '13.5px', marginBottom: '8px' }}>
                            🚀 <strong>New Lead Captured & AI Analyzed</strong>
                          </p>

                          <div className="slack-attachment" style={{ '--attach-color': scoreColor }}>
                            <div style={{ fontWeight: 'bold', fontSize: '14px', color: 'white', marginBottom: '4px' }}>
                              {lead.name} - {lead.company} ({lead.category})
                            </div>
                            <div style={{ fontSize: '13px', color: '#d1d2d3', marginBottom: '8px', lineHeight: '1.4' }}>
                              <strong>AI Summary:</strong> {lead.aiSummary}<br/>
                              <strong>Suggested Action:</strong> {lead.suggestedAction}
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '12px', color: '#abacad', background: 'rgba(0,0,0,0.15)', padding: '8px', borderRadius: '4px' }}>
                              <div>📧 <strong>Email:</strong> {lead.email}</div>
                              <div>💵 <strong>Budget:</strong> {lead.budget}</div>
                              <div>👥 <strong>Size:</strong> {lead.companySize}</div>
                              <div>🎯 <strong>AI Score:</strong> {lead.leadScore}/100</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Integration Settings Overlay */}
      {showSettings && (
        <div className="settings-overlay">
          <div className="settings-modal">
            <div className="settings-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <SettingsIcon size={20} className="text-gradient" />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'white' }}>Integration Settings</h3>
              </div>
              <button className="settings-close-btn" onClick={() => setShowSettings(false)}>
                <X size={20} />
              </button>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
              Connect real API keys to verify production workflows. Leaves fields blank to run in simulated mode.
            </p>

            <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label>Gemini API Key</label>
                  {apiStatus.hasGemini ? (
                    <span className="api-badge api-connected">Active</span>
                  ) : (
                    <span className="api-badge api-disconnected">Simulation</span>
                  )}
                </div>
                <input
                  type="password"
                  placeholder={apiStatus.hasGemini ? "••••••••••••••••" : "Paste Gemini API Key (e.g. AIzaSy...)"}
                  className="input-field"
                  value={settingsForm.geminiApiKey}
                  onChange={(e) => setSettingsForm({...settingsForm, geminiApiKey: e.target.value})}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Used to generate actual lead summaries, score quality, and identify pain points.
                </span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label>Slack Webhook URL</label>
                  {apiStatus.hasSlack ? (
                    <span className="api-badge api-connected">Active</span>
                  ) : (
                    <span className="api-badge api-disconnected">Simulation</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={apiStatus.hasSlack ? "••••••••••••••••" : "https://hooks.slack.com/services/... "}
                  className="input-field"
                  value={settingsForm.slackWebhookUrl}
                  onChange={(e) => setSettingsForm({...settingsForm, slackWebhookUrl: e.target.value})}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                  Triggers Slack messages instantly to your workspace channels.
                </span>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <label>Google Sheet Webhook URL</label>
                  {apiStatus.hasGoogleSheet ? (
                    <span className="api-badge api-connected">Active</span>
                  ) : (
                    <span className="api-badge api-disconnected">Simulation</span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={apiStatus.hasGoogleSheet ? "••••••••••••••••" : "Google App Script Web URL..."}
                  className="input-field"
                  value={settingsForm.googleSheetUrl}
                  onChange={(e) => setSettingsForm({...settingsForm, googleSheetUrl: e.target.value})}
                />
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '6px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--color-success)', display: 'block', fontWeight: 'bold', marginBottom: '2px' }}>
                    💡 Set up Google Sheets in 30 seconds:
                  </span>
                  <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', lineHeight: '1.3', display: 'block' }}>
                    1. Create a Google Sheet.<br/>
                    2. Go to Extensions &gt; Apps Script.<br/>
                    3. Paste <code>{`function doPost(e) { var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet(); var d = JSON.parse(e.postData.contents); var emailSent = false; sheet.appendRow([new Date(), d.name, d.email, d.company, d.companySize, d.budget, d.leadScore, d.aiSummary, d.category, d.suggestedAction]); if (d.emailReceiver) { MailApp.sendEmail(d.emailReceiver, "New lead: " + d.name + " - " + d.company, "Name: " + d.name + "\\nEmail: " + d.email + "\\nCompany: " + d.company + "\\nBudget: " + d.budget + "\\nLead Score: " + d.leadScore + "\\nCategory: " + d.category + "\\n\\nAI Summary: " + d.aiSummary + "\\n\\nSuggested Action: " + d.suggestedAction + "\\n\\nMessage: " + d.message); emailSent = true; } return ContentService.createTextOutput(JSON.stringify({ ok: true, emailSent: emailSent })).setMimeType(ContentService.MimeType.JSON); }`}</code><br/>
                    4. Click "Deploy" &gt; "New Deployment" &gt; Select "Web App" &gt; Execute as "Me", Who has access: "Anyone". Copy & paste the URL here.
                  </span>
                </div>
              </div>

              <div className="form-group">
                <label>Admin Notification Email Receiver</label>
                <input
                  type="email"
                  placeholder="sales@company.com"
                  className="input-field"
                  value={settingsForm.emailReceiver}
                  onChange={(e) => setSettingsForm({...settingsForm, emailReceiver: e.target.value})}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button 
                  type="button" 
                  className="nav-btn" 
                  style={{ flex: 1 }} 
                  onClick={() => setShowSettings(false)}
                  disabled={isSavingSettings}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="submit-btn" 
                  style={{ flex: 2 }}
                  disabled={isSavingSettings}
                >
                  {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                </button>
              </div>

              {saveSuccess && (
                <div style={{ color: 'var(--color-success)', fontSize: '13px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <Check size={16} /> Configuration saved and updated successfully!
                </div>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer style={{ marginTop: 'auto', padding: '20px 40px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'between', alignItems: 'center', fontSize: '12px', color: 'var(--text-dim)' }}>
        <p>© 2026 LeadFlow AI Automation. Designed to prove advanced agentic integrations.</p>
        <p style={{ marginLeft: 'auto' }}>
          Technologies: Node.js • Express • React • Vite • Gemini API • Slack SDK
        </p>
      </footer>
    </div>
  );
}
