// KpiCard.jsx
const fmt = (n) =>
  '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

export function KpiCard({ label, value, sub, color, isMoney = true, isCount = false }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color }}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">
        {isCount ? Number(value || 0).toLocaleString() : isMoney ? fmt(value) : value}
      </div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

export function KpiGrid({ totals }) {
  if (!totals) return null;
  return (
    <div className="kpi-grid">
      <KpiCard
        label="Confirmed Bookings"
        value={totals.bookings}
        sub="Completed · Not cancelled · Amount > $0"
        color="#f59e0b"
        isCount
      />
      <KpiCard
        label="Total Revenue (post-tax)"
        value={totals.revenue}
        sub="Sum of Amount column"
        color="#10b981"
      />
      <KpiCard
        label="Pre-Tax Revenue"
        value={totals.pretax}
        sub="Sum of Price column"
        color="#64748b"
      />
      <KpiCard
        label="HST Collected"
        value={totals.hst}
        sub="Amount − Price (where tax applied)"
        color="#6366f1"
      />
      <KpiCard
        label="Total Tips"
        value={totals.tips}
        sub="100% to provider · Not taxed"
        color="#8b5cf6"
      />
      <KpiCard
        label="Cash Collected"
        value={totals.cash}
        sub="Payment processor = Cash"
        color="#f59e0b"
      />
      <KpiCard
        label="Online (Stripe)"
        value={totals.stripe}
        sub="Payment processor = stripe"
        color="#3b82f6"
      />
      <KpiCard
        label="Pay Later"
        value={totals.paylater}
        sub="Invoiced · Collected at chair"
        color="#ec4899"
      />
      <KpiCard
        label="Total Client Spend"
        value={totals.total}
        sub="Revenue + Tips"
        color="#10b981"
      />
    </div>
  );
}
