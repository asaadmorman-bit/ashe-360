import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GraduationCap, Calendar, Users, Clock, X, CheckCircle2 } from 'lucide-react';
import EDSNav from '../components/eds/EDSNav';
import EDSFooter from '../components/eds/EDSFooter';
import { format } from 'date-fns';

const CATEGORY_COLORS = {
  cybersecurity: '#00e5c8', compliance: '#38bdf8', technical: '#8b5cf6',
  leadership: '#f97316', sales: '#eab308', operations: '#64748b',
};

const FORMAT_LABELS = {
  live_virtual: '🖥️ Live Virtual', in_person: '🏢 In-Person',
  on_demand: '📼 On Demand', hybrid: '🔀 Hybrid',
};

const BLANK_REG = { student_name: '', student_email: '', company: '' };

function ClassCard({ cls, onRegister }) {
  const spots = (cls.max_capacity || 30) - (cls.current_enrollment || 0);
  const color = CATEGORY_COLORS[cls.category] || '#64748b';
  const full = spots <= 0;

  return (
    <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${color}20`, borderTop: `3px solid ${color}`, borderRadius: 16, padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ background: `${color}18`, color, border: `1px solid ${color}30`, borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700 }}>
          {cls.category?.toUpperCase()}
        </span>
        <span style={{ color: '#64748b', fontSize: 12 }}>{FORMAT_LABELS[cls.format] || cls.format}</span>
      </div>
      <div>
        <h3 style={{ margin: 0, color: '#e2e8f0', fontSize: 17, fontWeight: 800, lineHeight: 1.3 }}>{cls.title}</h3>
        {cls.instructor && <div style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>Instructor: {cls.instructor}</div>}
      </div>
      {cls.description && <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6, margin: 0 }}>{cls.description}</p>}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {cls.start_date && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#64748b', fontSize: 12 }}>
            <Calendar size={13} />
            {format(new Date(cls.start_date), 'MMM d, yyyy')}
            {cls.end_date && cls.end_date !== cls.start_date && ` – ${format(new Date(cls.end_date), 'MMM d')}`}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: full ? '#ef4444' : '#64748b', fontSize: 12 }}>
          <Users size={13} />
          {full ? 'Class Full' : `${spots} spots left`}
        </div>
        {cls.price !== undefined && (
          <div style={{ color: cls.price === 0 ? '#22c55e' : '#e2e8f0', fontSize: 13, fontWeight: 700, fontFamily: 'monospace' }}>
            {cls.price === 0 ? 'FREE' : `$${cls.price.toLocaleString()}`}
          </div>
        )}
      </div>
      <button
        disabled={full || cls.status !== 'upcoming'}
        onClick={() => onRegister(cls)}
        style={{
          padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: full ? 'not-allowed' : 'pointer',
          border: 'none', background: full ? '#1e293b' : color, color: full ? '#334155' : '#071520',
          marginTop: 4, transition: 'opacity 0.2s', opacity: full ? 0.6 : 1,
        }}
      >
        {full ? 'Class Full' : cls.status === 'upcoming' ? 'Register Now →' : cls.status?.replace(/_/g,' ')}
      </button>
    </div>
  );
}

function RegisterModal({ cls, onClose }) {
  const [form, setForm] = useState(BLANK_REG);
  const [done, setDone] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => base44.entities.TrainingRegistration.create({
      ...data,
      class_id: cls.id,
      registration_status: 'registered',
      payment_status: cls.price === 0 ? 'waived' : 'pending',
    }),
    onSuccess: () => setDone(true),
  });

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(7,21,32,0.85)', backdropFilter: 'blur(8px)' }}>
      <div style={{ background: '#0d2235', border: '1px solid rgba(0,229,200,0.2)', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440, margin: '0 16px', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'transparent', border: 'none', color: '#475569', cursor: 'pointer' }}>
          <X size={18} />
        </button>
        {done ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
            <div style={{ color: '#22c55e', fontWeight: 800, fontSize: 20, marginBottom: 8 }}>Registration Confirmed!</div>
            <div style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>You've been registered for <strong style={{ color: '#e2e8f0' }}>{cls.title}</strong>. Check your email for confirmation details.</div>
            <button onClick={onClose} style={{ marginTop: 20, padding: '10px 24px', borderRadius: 10, background: '#00e5c8', color: '#071520', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Done</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: '#00e5c8', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Register for Class</div>
              <div style={{ color: '#e2e8f0', fontWeight: 800, fontSize: 17 }}>{cls.title}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { key: 'student_name', label: 'Full Name *', placeholder: 'Jane Smith', type: 'text' },
                { key: 'student_email', label: 'Email Address *', placeholder: 'jane@company.com', type: 'email' },
                { key: 'company', label: 'Organization', placeholder: 'Company or Agency', type: 'text' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ color: '#64748b', fontSize: 12, display: 'block', marginBottom: 4 }}>{f.label}</label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(0,229,200,0.15)', borderRadius: 8, color: '#e2e8f0', fontSize: 14, padding: '10px 12px', outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
              ))}
              <button
                onClick={() => mutation.mutate(form)}
                disabled={!form.student_name || !form.student_email || mutation.isPending}
                style={{ padding: '12px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: '#00e5c8', color: '#071520', border: 'none', cursor: 'pointer', marginTop: 4, opacity: mutation.isPending ? 0.7 : 1 }}
              >
                {mutation.isPending ? 'Registering...' : 'Complete Registration →'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function TrainingPublic() {
  const [selectedCls, setSelectedCls] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState('all');

  const { data: classes = [] } = useQuery({
    queryKey: ['training-classes-public'],
    queryFn: () => base44.entities.TrainingClass.filter({ status: 'upcoming' }, '-start_date', 50),
    initialData: [],
  });

  const categories = ['all', ...Object.keys(CATEGORY_COLORS)];
  const filtered = categoryFilter === 'all' ? classes : classes.filter(c => c.category === categoryFilter);

  return (
    <div style={{ background: 'linear-gradient(160deg, #071520 0%, #0a2030 50%, #082828 100%)', minHeight: '100vh', fontFamily: "'Inter',system-ui,sans-serif", color: '#e2e8f0' }}>
      <EDSNav />

      {/* Hero */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 24px 40px' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎖️</div>
          <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(28px,4vw,44px)', fontWeight: 900, color: '#e2e8f0', lineHeight: 1.1 }}>
            EDS Defense & Security Training
          </h1>
          <p style={{ color: '#64748b', fontSize: 16, maxWidth: 580, margin: '0 auto 24px', lineHeight: 1.7 }}>
            DISA-aligned, certification-ready programs built for government contractors, military personnel, and enterprise security teams. In-person, virtual, and on-demand.
          </p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: 'none',
                  background: categoryFilter === cat ? (CATEGORY_COLORS[cat] || '#00e5c8') : 'rgba(255,255,255,0.05)',
                  color: categoryFilter === cat ? '#071520' : '#64748b',
                  transition: 'all 0.15s',
                }}
              >
                {cat === 'all' ? 'All Classes' : cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#334155' }}>
            <GraduationCap size={40} style={{ margin: '0 auto 16px', opacity: 0.3 }} />
            <div style={{ fontSize: 16 }}>No upcoming classes in this category.</div>
            <div style={{ fontSize: 13, marginTop: 8 }}>Check back soon or <a href="/contact" style={{ color: '#00e5c8', textDecoration: 'none' }}>contact us</a> for custom training.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filtered.map(cls => (
              <ClassCard key={cls.id} cls={cls} onRegister={setSelectedCls} />
            ))}
          </div>
        )}

        {/* CTA */}
        <div style={{ textAlign: 'center', marginTop: 60, padding: '40px 24px', background: 'rgba(0,229,200,0.04)', border: '1px solid rgba(0,229,200,0.12)', borderRadius: 16 }}>
          <div style={{ color: '#00e5c8', fontWeight: 800, fontSize: 18, marginBottom: 8 }}>Need Custom Training?</div>
          <p style={{ color: '#475569', fontSize: 14, marginBottom: 20 }}>We deliver tailored programs for government agencies, DoD contractors, and enterprise teams. On-site available.</p>
          <a href="/contact" style={{ padding: '12px 28px', borderRadius: 10, background: '#00e5c8', color: '#071520', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>Request Custom Training →</a>
        </div>
      </div>

      <EDSFooter />
      {selectedCls && <RegisterModal cls={selectedCls} onClose={() => setSelectedCls(null)} />}
    </div>
  );
}