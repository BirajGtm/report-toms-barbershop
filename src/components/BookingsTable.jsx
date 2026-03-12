// BookingsTable.jsx
import { useState, useMemo } from 'react';

const fmt = (n) =>
  '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const PAGE_SIZE = 25;

function PayBadge({ pay, raw }) {
  const cls = { cash: 'pay-cash', stripe: 'pay-stripe', paylater: 'pay-paylater' }[pay] || 'pay-other';
  const label = { cash: 'Cash', stripe: 'Stripe', paylater: 'Pay Later' }[pay] || (raw || 'Unspecified');
  return <span className={`pay-badge ${cls}`}>{label}</span>;
}

const COLS = [
  { key: 'apptDateISO', label: 'Date'    },
  { key: 'time',        label: 'Time'    },
  { key: 'service',     label: 'Service' },
  { key: 'provider',    label: 'Provider'},
  { key: 'location',    label: 'Location'},
  { key: 'client',      label: 'Client'  },
  { key: 'price',       label: 'Pre-Tax' },
  { key: 'hst',         label: 'HST'     },
  { key: 'amount',      label: 'Amount'  },
  { key: 'tips',        label: 'Tips'    },
  { key: 'total',       label: 'Total'   },
  { key: 'payment',     label: 'Payment' },
];

export function BookingsTable({ rows }) {
  const [sort, setSort] = useState({ col: 'apptDateISO', dir: -1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (r) =>
        r.client.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        r.location.toLowerCase().includes(q) ||
        r.code.toLowerCase().includes(q) ||
        r.paymentRaw.toLowerCase().includes(q)
    );
  }, [rows, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sort.col], bv = b[sort.col];
      if (av == null) return 1; if (bv == null) return -1;
      return (typeof av === 'string' ? av.localeCompare(bv) : av - bv) * sort.dir;
    });
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = sorted.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggle = (col) => {
    setSort((s) => ({ col, dir: s.col === col ? s.dir * -1 : -1 }));
    setPage(1);
  };

  const icon = (col) => {
    if (sort.col !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sort.dir === 1 ? '↑' : '↓'}</span>;
  };

  // Page buttons
  const pgBtns = () => {
    const btns = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) btns.push(i);
    } else {
      btns.push(1);
      if (safePage > 3) btns.push('…');
      for (let i = Math.max(2, safePage - 1); i <= Math.min(totalPages - 1, safePage + 1); i++) btns.push(i);
      if (safePage < totalPages - 2) btns.push('…');
      btns.push(totalPages);
    }
    return btns;
  };

  return (
    <div className="card">
      <div className="card-header">
        <h3>📋 Confirmed Bookings</h3>
        <span className="badge-count">{filtered.length} bookings</span>
      </div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search by client, service, provider, location, code…"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  className={sort.col === c.key ? 'sorted' : ''}
                  style={['price','hst','amount','tips','total'].includes(c.key) ? { textAlign: 'right' } : {}}
                  onClick={() => toggle(c.key)}
                >
                  {c.label} {icon(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={12}>
                  <div className="empty-state">
                    <div className="icon">🔍</div>
                    <p>No bookings match your search.</p>
                  </div>
                </td>
              </tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.code || i}>
                  <td>{r.date}</td>
                  <td className="c-muted">{r.time}</td>
                  <td><strong>{r.service}</strong></td>
                  <td>{r.provider}</td>
                  <td>📍 {r.location}</td>
                  <td>{r.client}</td>
                  <td className="col-right money c-muted">{fmt(r.price)}</td>
                  <td className="col-right money c-blue">
                    {r.hst > 0 ? fmt(r.hst) : <span className="c-muted">—</span>}
                  </td>
                  <td className="col-right money c-green"><strong>{fmt(r.amount)}</strong></td>
                  <td className="col-right money c-purple">
                    {r.tips > 0 ? <strong>{fmt(r.tips)}</strong> : <span className="c-muted">—</span>}
                  </td>
                  <td className="col-right money c-amber"><strong>{fmt(r.total)}</strong></td>
                  <td><PayBadge pay={r.payment} raw={r.paymentRaw} /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="c-muted">
          Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}
        </span>
        <div className="pg-btns">
          {pgBtns().map((b, i) =>
            b === '…' ? (
              <button key={`dot-${i}`} className="pg-btn" disabled>…</button>
            ) : (
              <button
                key={b}
                className={`pg-btn ${b === safePage ? 'active' : ''}`}
                onClick={() => setPage(b)}
              >
                {b}
              </button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
