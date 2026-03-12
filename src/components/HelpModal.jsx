import { useState } from 'react';

export function HelpModal() {
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          background: 'none', border: '1px solid var(--border)', color: 'var(--muted)',
          padding: '6px 12px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '6px', transition: 'all 0.2s',
          fontFamily: 'inherit'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--accent)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
      >
        <span style={{ fontSize: '16px' }}>💡</span> How this dashboard works
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)',
      zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        maxWidth: '700px', width: '100%', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 48px rgba(0,0,0,0.6)', display: 'flex', flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: 'var(--bg2)', zIndex: 2
        }}>
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>💡</span> Understanding the Data
          </h2>
          <button 
            onClick={() => setIsOpen(false)}
            style={{
              background: 'var(--bg3)', border: 'none', color: 'var(--text)', 
              width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg4)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg3)'}
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px', fontSize: '14px', lineHeight: 1.6, color: 'var(--text)' }}>
          
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--accent)', marginBottom: '8px' }}>✅ Confirmed Bookings</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>
              Bookings that are **included** in your total revenue, provider earnings, and charts. An appointment is considered confirmed if it is <strong>not cancelled</strong> and at least one of these is true:
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--muted)' }}>
              <li>The post-tax <strong>Amount</strong> collected is greater than $0.</li>
              <li>The <strong>Tip</strong> collected is greater than $0 (even if the service was $0/comped, the provider still gets their tip).</li>
            </ul>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '15px', color: '#ef4444', marginBottom: '8px' }}>⚠️ Unfinished / Cancelled</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '12px' }}>
              Bookings that are <strong>completely excluded</strong> from revenue and earnings so they don't inflate your numbers.
              They appear in the <em>Unfinished</em> table at the bottom. 
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--muted)' }}>
              <li>The booking was explicitly cancelled.</li>
              <li>The service amount was $0 AND the tip was $0 (a no-show or untendered appointment).</li>
            </ul>
          </div>

          <div style={{ marginBottom: '24px', background: 'rgba(245,158,11,0.05)', border: '1px solid rgba(245,158,11,0.2)', padding: '16px', borderRadius: '8px' }}>
            <h3 style={{ fontSize: '15px', color: 'var(--accent)', marginBottom: '8px' }}>✂️ How Provider Earnings Work</h3>
            <p style={{ color: 'var(--muted)', marginBottom: '8px' }}>
              The system protects provider payouts by distinctly separating service revenue from tips.
            </p>
            <ul style={{ paddingLeft: '20px', color: 'var(--muted)', margin: 0 }}>
              <li style={{ marginBottom: '4px' }}><strong>Service Revenue:</strong> The total post-tax amount the shop charged the client.</li>
              <li style={{ marginBottom: '4px' }}><strong>Tips:</strong> Read strictly from the tip column. These are completely tax-free and 100% credited to the provider.</li>
              <li><strong>Total Earned:</strong> Service Revenue + Tips.</li>
            </ul>
          </div>

           <div>
            <h3 style={{ fontSize: '15px', color: 'var(--blue)', marginBottom: '8px' }}>💳 Payment Methods</h3>
            <ul style={{ paddingLeft: '20px', color: 'var(--muted)', margin: 0 }}>
              <li style={{ marginBottom: '4px' }}><strong>Cash:</strong> Cash transactions.</li>
              <li style={{ marginBottom: '4px' }}><strong>Online (Stripe):</strong> Online or card payments via Stripe.</li>
              <li><strong>Pay Later:</strong> "delay" payments — an invoice was created but payment hasn't been processed online (often collected at the chair).</li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
