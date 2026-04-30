import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Bot, Send, Loader2, Terminal, Shield, Network, ClipboardCheck, Cpu, ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const AGENTS = [
  { key: 'soc_analyst',         label: 'SOC Analyst',          icon: Shield,       color: 'text-red-400',    desc: 'T1-T3 triage, IR, threat hunting' },
  { key: 'noc_engineer',        label: 'NOC Engineer',          icon: Network,      color: 'text-blue-400',   desc: 'Infrastructure, DNS, Cloudflare' },
  { key: 'compliance_architect',label: 'Compliance Architect',  icon: ClipboardCheck, color: 'text-purple-400', desc: 'NIST, CMMC, FedRAMP, STIG, ATO' },
  { key: 'overnight_watch',     label: 'Overnight Watch',       icon: Terminal,     color: 'text-green-400',  desc: 'Night ops, SLA monitoring' },
];

const QUICK_PROMPTS = [
  'Run a full threat triage — summarize all open critical incidents and KEV vulnerabilities',
  'Give me a DNS and SSL health check for all Cloudflare zones',
  'Generate an MSSP client compliance report with CMMC and NIST RMF status',
  'Identify the top 5 highest-risk assets and recommended immediate actions',
  'Check for any ATO expirations in the next 90 days',
  'Correlate current threat intel IOCs against our known asset inventory',
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Bot className="w-3.5 h-3.5 text-primary" />
        </div>
      )}
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${isUser ? 'bg-primary text-primary-foreground' : 'bg-card/80 border border-border/40 text-foreground'}`}>
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
              li: ({ children }) => <li className="my-0.5">{children}</li>,
              strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
            }}
          >
            {msg.content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}

export default function SOCAgentConsole() {
  const [selectedAgent, setSelectedAgent] = useState(AGENTS[0]);
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [agentDropdown, setAgentDropdown] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  // Create a new conversation when agent changes
  useEffect(() => {
    setConversation(null);
    setMessages([]);
  }, [selectedAgent]);

  useEffect(() => {
    if (!conversation) return;
    const unsub = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return unsub;
  }, [conversation?.id]);

  const send = async (text) => {
    const msg = text || input.trim();
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

  const AgentIcon = selectedAgent.icon;

  return (
    <div className="glass-panel rounded-xl overflow-hidden flex flex-col h-[600px]">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-border/50 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">EDS SOCaaS Agent Console</p>
          <p className="text-xs text-muted-foreground">AI-powered SOC · NOC · GRC operations</p>
        </div>

        {/* Agent selector */}
        <div className="relative ml-auto">
          <button
            onClick={() => setAgentDropdown(!agentDropdown)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 hover:border-primary/40 transition-colors text-sm"
          >
            <AgentIcon className={`w-3.5 h-3.5 ${selectedAgent.color}`} />
            <span className="text-foreground font-medium">{selectedAgent.label}</span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          {agentDropdown && (
            <div className="absolute right-0 top-full mt-1 w-64 bg-card border border-border/50 rounded-xl shadow-2xl z-50 overflow-hidden">
              {AGENTS.map(a => (
                <button
                  key={a.key}
                  onClick={() => { setSelectedAgent(a); setAgentDropdown(false); }}
                  className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-secondary/50 transition-colors text-left ${selectedAgent.key === a.key ? 'bg-primary/10' : ''}`}
                >
                  <a.icon className={`w-4 h-4 ${a.color} mt-0.5 flex-shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.label}</p>
                    <p className="text-xs text-muted-foreground">{a.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center text-center gap-2 pb-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <AgentIcon className={`w-6 h-6 ${selectedAgent.color}`} />
              </div>
              <p className="text-sm font-semibold text-foreground">{selectedAgent.label} Ready</p>
              <p className="text-xs text-muted-foreground max-w-xs">{selectedAgent.desc} — ask anything or use a quick prompt</p>
            </div>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => send(p)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-secondary/30 border border-border/40 text-muted-foreground hover:text-foreground hover:border-primary/30 hover:bg-secondary/50 transition-all"
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.filter(m => m.role !== 'system').map((msg, i) => (
          <MessageBubble key={i} msg={msg} />
        ))}
        {sending && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="bg-card/80 border border-border/40 rounded-2xl px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground">{selectedAgent.label} analyzing…</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 flex-shrink-0 border-t border-border/30 pt-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder={`Ask ${selectedAgent.label}…`}
            className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/40 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
            disabled={sending}
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2 text-sm font-medium"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}