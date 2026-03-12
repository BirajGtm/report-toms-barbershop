// ProviderTable.jsx
import { useState, useMemo } from 'react';

const fmt = (n) =>
  '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const COLS = [
  { key: 'provider', label: 'Provider',               align: 'left'  },
  { key: 'bookings', label: 'Bookings',               align: 'right' },
  { key: 'pretax',   label: 'Pre-Tax (Price)',        align: 'right' },
  { key: 'hst',      label: 'HST',                   align: 'right' },
  { key: 'revenue',  label: 'Service Revenue (Amt)', align: 'right' },
  { key: 'tips',     label: 'Tips (100% theirs)',    align: 'right' },
  { key: 'total',    label: 'Total Earned',           align: 'right' },
  { key: 'cash',     label: 'Cash',                  align: 'right' },
  { key: 'stripe',   label: 'Stripe',                align: 'right' },
  { key: 'paylater', label: 'Pay Later',             align: 'right' },
];

export function ProviderTable({ byProvider }) {
  const [sort, setSort] = useState({ col: 'revenue', dir: -1 });

  const sorted = useMemo(() => {
    return [...(byProvider || [])].sort((a, b) => {
      const av = a[sort.col], bv = b[sort.col];
      return (typeof av === 'string' ? av.localeCompare(bv) : av - bv) * sort.dir;
    });
  }, [byProvider, sort]);

  const totals = useMemo(() => ({
    bookings: sorted.reduce((s, r) => s + r.bookings, 0),
    pretax:   sorted.reduce((s, r) => s + r.pretax,   0),
    hst:      sorted.reduce((s, r) => s + r.hst,      0),
    revenue:  sorted.reduce((s, r) => s + r.revenue,  0),
    tips:     sorted.reduce((s, r) => s + r.tips,     0),
    total:    sorted.reduce((s, r) => s + r.total,    0),
    cash:     sorted.reduce((s, r) => s + r.cash,     0),
    stripe:   sorted.reduce((s, r) => s + r.stripe,   0),
    paylater: sorted.reduce((s, r) => s + r.paylater, 0),
  }), [sorted]);

  const toggle = (col) =>
    setSort((s) => ({ col, dir: s.col === col ? s.dir * -1 : -1 }));

  const icon = (col) => {
    if (sort.col !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sort.dir === 1 ? '↑' : '↓'}</span>;
  };

  if (!sorted.length) return <div className="empty-state"><div className="icon">📭</div><p>No provider data.</p></div>;

  return (
    <div className="card">
      <div className="card-header">
        <h3>✂️ Provider Earnings Breakdown</h3>
        <span className="badge-count">{sorted.length} providers</span>
      </div>

      {/* Explainer */}
      <div className="provider-highlight" style={{ margin: '16px 24px 0' }}>
        <strong>How provider earnings work: </strong>
        <strong>Service Revenue</strong> = Amount charged (post-tax) ·{' '}
        <strong>Tips</strong> = 100% to provider, zero tax deducted ·{' '}
        <strong>Total Earned</strong> = Service Revenue + Tips
      </div>

      <div className="table-wrap" style={{ marginTop: 16 }}>
        <table>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={sort.col === c.key ? 'sorted' : ''}
                  style={{ textAlign: c.align }}
                  onClick={() => toggle(c.key)}
                >
                  {c.label} {icon(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r) => (
              <tr key={r.provider}>
                <td><strong>{r.provider}</strong></td>
                <td className="col-right">{r.bookings}</td>
                <td className="col-right money c-muted">{fmt(r.pretax)}</td>
                <td className="col-right money c-blue">{r.hst > 0 ? fmt(r.hst) : <span className="c-muted">—</span>}</td>
                <td className="col-right money c-green"><strong>{fmt(r.revenue)}</strong></td>
                <td className="col-right money c-purple">
                  {r.tips > 0 ? <strong>{fmt(r.tips)}</strong> : <span className="c-muted">—</span>}
                </td>
                <td className="col-right money c-amber"><strong>{fmt(r.total)}</strong></td>
                <td className="col-right money">{r.cash > 0 ? fmt(r.cash) : <span className="c-muted">—</span>}</td>
                <td className="col-right money c-blue">{r.stripe > 0 ? fmt(r.stripe) : <span className="c-muted">—</span>}</td>
                <td className="col-right money c-pink">{r.paylater > 0 ? fmt(r.paylater) : <span className="c-muted">—</span>}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td>TOTAL</td>
              <td className="col-right">{totals.bookings}</td>
              <td className="col-right money">{fmt(totals.pretax)}</td>
              <td className="col-right money">{fmt(totals.hst)}</td>
              <td className="col-right money">{fmt(totals.revenue)}</td>
              <td className="col-right money">{fmt(totals.tips)}</td>
              <td className="col-right money">{fmt(totals.total)}</td>
              <td className="col-right money">{fmt(totals.cash)}</td>
              <td className="col-right money">{fmt(totals.stripe)}</td>
              <td className="col-right money">{fmt(totals.paylater)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
