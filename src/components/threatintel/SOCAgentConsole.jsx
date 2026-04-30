import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  Bot, Send, Loader2, Terminal, Shield, Network, ClipboardCheck,
  Cpu, ChevronDown, CheckCircle2, AlertCircle, Clock, ChevronRight, Plus
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENTS = [
  {
    key: 'soc_analyst',
    label: 'SOC Analyst',
    icon: Shield,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    desc: 'T1-T3 triage · IR · Threat Hunting · MSSP Reporting',
    prompts: [
      'Run a full threat triage — summarize all open critical incidents and KEV vulnerabilities',
      'Identify the top 5 highest-risk assets and recommend immediate actions',
      'Correlate current threat intel IOCs against our known asset inventory',
      'Generate an MSSP client security report with all open risks',
      'What are the most pressing incidents requiring immediate response right now?',
    ],
  },
  {
    key: 'noc_engineer',
    label: 'NOC Engineer',
    icon: Network,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    desc: 'Infrastructure · DNS · SSL · Cloudflare · Network Health',
    prompts: [
      'Give me a full DNS and SSL health check for all Cloudflare zones',
      'List all assets that are inactive or haven\'t been scanned in the last 7 days',
      'Identify any DDoS patterns or geo-threat anomalies from recent traffic data',
      'Check for open network incidents and create tickets for unresolved P2/P3 issues',
      'What WAF rule improvements do you recommend based on current threat traffic?',
    ],
  },
  {
    key: 'compliance_architect',
    label: 'Compliance Architect',
    icon: ClipboardCheck,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/20',
    desc: 'NIST · CMMC · FedRAMP · STIG · ATO Lifecycle · GRC',
    prompts: [
      'Check for any ATO expirations in the next 90 days and flag expired systems',
      'Prioritize all open CAT I STIG findings and generate a remediation plan',
      'Generate a CMMC Level 2 compliance gap analysis across all clients',
      'What POA&M items are overdue or at risk of missing SLA deadlines?',
      'Map our current STIG findings to NIST 800-53 control failures',
    ],
  },
  {
    key: 'overnight_watch',
    label: 'Overnight Watch',
    icon: Terminal,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    desc: 'Night ops · SLA monitoring · On-call triage',
    prompts: [
      'Run the full night watch — check all open incidents, tickets, and SLA breaches',
      'Are there any SLA-breached incidents or tickets that need immediate escalation?',
      'Summarize all new STIG and vulnerability findings from the last 24 hours',
      'What are the recommended morning priorities for the SOC team?',
      'Check for any new critical threat intel alerts since last shift',
    ],
  },
];

// ── Tool call status display ──────────────────────────────────────────────────
function ToolCallBadge({ toolCall }) {
  const [expanded, setExpanded] = useState(false);
  const name = toolCall?.name || 'Tool';
  const status = toolCall?.status || 'pending';

  const statusConfig = {
    pending:     { icon: Clock,        color: 'text-slate-400', text: 'Pending' },
    running:     { icon: Loader2,      color: 'text-blue-400',  text: 'Running…', spin: true },
    in_progress: { icon: Loader2,      color: 'text-blue-400',  text: 'Running…', spin: true },
    completed:   { icon: CheckCircle2, color: 'text-green-400', text: 'Done' },
    success:     { icon: CheckCircle2, color: 'text-green-400', text: 'Done' },
    failed:      { icon: AlertCircle,  color: 'text-red-400',   text: 'Failed' },
    error:       { icon: AlertCircle,  color: 'text-red-400',   text: 'Failed' },
  }[status] || { icon: Clock, color: 'text-slate-400', text: '' };

  const Icon = statusConfig.icon;
  const displayName = name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <div className="mt-1.5 text-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/40 border border-border/40 hover:bg-secondary/60 transition-colors"
      >
        <Icon className={`w-3 h-3 ${statusConfig.color} ${statusConfig.spin ? 'animate-spin' : ''}`} />
        <span className="text-muted-foreground font-mono">{displayName}</span>
        {statusConfig.text && <span className={`${statusConfig.color} ml-1`}>· {statusConfig.text}</span>}
        {!statusConfig.spin && (toolCall.arguments_string || toolCall.results) && (
          <ChevronRight className={`w-3 h-3 text-muted-foreground ml-auto transition-transform ${expanded ? 'rotate-90' : ''}`} />
        )}
      </button>

      {expanded && !statusConfig.spin && (
        <div className="mt-1 ml-3 pl-3 border-l border-border/50 space-y-2">
          {toolCall.arguments_string && (
            <pre className="bg-black/30 rounded p-2 text-xs text-primary/80 overflow-x-auto whitespace-pre-wrap">
              {(() => { try { return JSON.stringify(JSON.parse(toolCall.arguments_string), null, 2); } catch { return toolCall.arguments_string; } })()}
            </pre>
          )}
          {toolCall.results && (
            <pre className="bg-black/30 rounded p-2 text-xs text-green-400/80 overflow-x-auto whitespace-pre-wrap max-h-40">
              {(() => { try { return JSON.stringify(JSON.parse(toolCall.results), null, 2); } catch { return toolCall.results; } })()}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}

// ── Message bubble ────────────────────────────────────────────────────────────
function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        {msg.content && (
          <div className={`rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card/80 border border-border/40 text-foreground'}`}>
            {isUser ? (
              <p>{msg.content}</p>
            ) : (
              <ReactMarkdown
                className="prose prose-sm prose-invert max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                components={{
                  code: ({ inline, children }) => inline
                    ? <code className="px-1 py-0.5 rounded bg-primary/20 text-primary text-xs font-mono">{children}</code>
                    : <pre className="bg-black/40 rounded-lg p-3 overflow-x-auto text-xs font-mono text-primary/90 my-2"><code>{children}</code></pre>,
                  p: ({ children }) => <p className="my-1 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="my-1 ml-4 list-disc">{children}</ul>,
                  ol: ({ children }) => <ol className="my-1 ml-4 list-decimal">{children}</ol>,
                  li: ({ children }) => <li className="my-0.5">{children}</li>,
                  strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
                  h1: ({ children }) => <h1 className="text-base font-bold my-2">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-sm font-bold my-2 text-primary/80">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-sm font-semibold my-1">{children}</h3>,
                }}
              >
                {msg.content}
              </ReactMarkdown>
            )}
          </div>
        )}
        {/* Tool calls */}
        {msg.tool_calls?.length > 0 && (
          <div className="mt-1 space-y-1 pl-1">
            {msg.tool_calls.map((tc, i) => <ToolCallBadge key={i} toolCall={tc} />)}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Console ──────────────────────────────────────────────────────────────
export default function SOCAgentConsole() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [agentDropdown, setAgentDropdown] = useState(false);
  const messagesEndRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Reset conversation when switching agents
  useEffect(() => {
    setConversation(null);
    setMessages([]);
  }, [selectedAgent.key]);

  // Subscribe to real-time conversation updates
  useEffect(() => {
    if (!conversation?.id) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setAgentDropdown(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg || sending) return;
    setInput('');
    setSending(true);
    try {
      let conv = conversation;
      if (!conv) {
        conv = await base44.agents.createConversation({
          agent_name: selectedAgent.key,
          metadata: { name: `SOCaaS Session — ${selectedAgent.label}` },
        });
        setConversation(conv);
      }
      await base44.agents.addMessage(conv, { role: 'user', content: msg });
    } finally {
      setSending(false);
    }
  };

  const startNewSession = () => {
    setConversation(null);
    setMessages([]);
  };

  const AgentIcon = selectedAgent.icon;
  const visibleMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[640px]">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border/50 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">EDS SOCaaS Agent Console</p>
          <p className="text-xs text-muted-foreground">Real-time triage · NOC · GRC · Overnight Watch</p>
        </div>

        {/* New session button */}
        {conversation && (
          <button onClick={startNewSession} title="New session"
            className="p-1.5 rounded-lg hover:bg-secondary/50 transition-colors text-muted-foreground hover:text-foreground">
            <Plus className="w-4 h-4" />
          </button>
        )}

        {/* Agent selector */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setAgentDropdown(!agentDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/40 transition-colors text-sm"
          >
            <AgentIcon className={`w-3.5 h-3.5 ${selectedAgent.color}`} />
            <span className="text-foreground font-medium hidden sm:inline">{selectedAgent.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>

          {agentDropdown && (
            <div className="absolute right-0 top-full mt-1 w-72 bg-card border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden">
              <p className="text-xs text-muted-foreground px-4 py-2 border-b border-border/30 font-semibold uppercase tracking-wider">Select Agent</p>
              {AGENTS.map(a => (
                <button
                  key={a.key}
                  onClick={() => { setSelectedAgent(a); setAgentDropdown(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${selectedAgent.key === a.key ? 'bg-primary/10' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-lg border flex items-center justify-center flex-shrink-0 mt-0.5 ${a.bg}`}>
                    <a.icon className={`w-3.5 h-3.5 ${a.color}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">{a.desc}</p>
                  </div>
                  {selectedAgent.key === a.key && <span className="ml-auto text-primary text-xs font-bold">Active</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {visibleMessages.length === 0 ? (
          <div className="space-y-4 py-2">
            {/* Agent intro */}
            <div className="flex flex-col items-center text-center gap-2 pb-2">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center ${selectedAgent.bg}`}>
                <AgentIcon className={`w-7 h-7 ${selectedAgent.color}`} />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{selectedAgent.label}</p>
                <p className="text-xs text-muted-foreground max-w-xs mt-0.5">{selectedAgent.desc}</p>
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">Online · Ready</span>
              </div>
            </div>

            {/* Quick prompts */}
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider px-1 mb-2">Quick Actions</p>
              {selectedAgent.prompts.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-lg bg-secondary/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary/50 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        ) : (
          visibleMessages.map((msg, i) => <MessageBubble key={i} msg={msg} />)
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card/80 border border-border/40 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">{selectedAgent.label} analyzing live data…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input ── */}
      <div className="px-4 pb-4 flex-shrink-0 border-t border-border/30 pt-3">
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder={`Ask ${selectedAgent.label}… (Shift+Enter for new line)`}
            rows={1}
            style={{ resize: 'none' }}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors min-h-[42px] max-h-28 overflow-y-auto"
            disabled={sending}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium flex-shrink-0"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 px-1">Agent reads live data from all entities · Actions are logged to AgentAction</p>
      </div>
    </div>
  );
}