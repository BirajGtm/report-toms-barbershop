// ReconciliationPanel.jsx — verifies all numbers cross-check correctly

const fmt = (n) =>
  '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

function ReconcileItem({ check }) {
  const { label, expected, actual, pass, fmt: fmtType, note } = check;
  const status = pass ? 'pass' : note ? 'warn' : 'fail';
  const icon   = pass ? '✅' : note ? '⚠️' : '❌';

  const display = (v) =>
    fmtType === 'count' ? Number(v).toLocaleString() : fmt(v);

  return (
    <div className={`reconcile-item ${status}`}>
      <div className="reconcile-icon">{icon}</div>
      <div>
        <div className="reconcile-label">{label}</div>
        <div className="reconcile-values">
          <span style={{ color: pass ? '#10b981' : '#ef4444' }}>
            {display(actual)}
          </span>
          <div className="expected">
            Expected: {display(expected)}
            {!pass && (
              <span style={{ marginLeft: 8, color: '#ef4444' }}>
                (Δ {fmt(Math.abs(actual - expected))})
              </span>
            )}
          </div>
        </div>
        {note && <div className="reconcile-note">{note}</div>}
      </div>
    </div>
  );
}

export function ReconciliationPanel({ checks }) {
  if (!checks?.length) return null;

  const passed = checks.filter((c) => c.pass).length;
  const total  = checks.length;
  const allOk  = passed === total;

  return (
    <div className="card">
      <div className="card-header">
        <h3>🔍 Reconciliation & Verification</h3>
        <span
          className="badge-count"
          style={{
            color:      allOk ? '#10b981' : '#ef4444',
            borderColor: allOk ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)',
            background:  allOk ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.08)',
          }}
        >
          {passed}/{total} checks passing
        </span>
      </div>

      <div style={{ padding: '16px 24px 24px' }}>
        {!allOk && (
          <div
            style={{
              background: 'rgba(239,68,68,0.07)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              fontSize: 13, color: '#f87171',
            }}
          >
            ⚠️ Some checks failed. Review flagged items below — this may indicate data issues or unrecognised payment formats in the report.
          </div>
        )}
        {allOk && (
          <div
            style={{
              background: 'rgba(16,185,129,0.07)',
              border: '1px solid rgba(16,185,129,0.25)',
              borderRadius: 10, padding: '12px 16px', marginBottom: 16,
              fontSize: 13, color: '#34d399',
            }}
          >
            ✅ All checks passing — all totals cross-verify correctly. Numbers are accurate.
          </div>
        )}
        <div className="reconcile-grid">
          {checks.map((c, i) => (
            <ReconcileItem key={i} check={c} />
          ))}
        </div>
      </div>
    </div>
  );
}
