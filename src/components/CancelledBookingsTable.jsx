import { useState, useMemo } from 'react';

const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const PAGE_SIZE = 15;

const COLS = [
  { key: 'apptDateISO', label: 'Date'    },
  { key: 'time',        label: 'Time'    },
  { key: 'service',     label: 'Service' },
  { key: 'provider',    label: 'Provider'},
  { key: 'client',      label: 'Client'  },
  { key: 'status',      label: 'Status/Reason' },
  { key: 'price',       label: 'Price'   },
];

export function CancelledBookingsTable({ rows }) {
  const [sort, setSort] = useState({ col: 'apptDateISO', dir: -1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return rows;
    return rows.filter(r =>
        r.client.toLowerCase().includes(q) ||
        r.service.toLowerCase().includes(q) ||
        r.provider.toLowerCase().includes(q) ||
        (r.cancellationType || '').toLowerCase().includes(q)
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
    setSort(s => ({ col, dir: s.col === col ? s.dir * -1 : -1 }));
    setPage(1);
  };

  const icon = (col) => {
    if (sort.col !== col) return <span className="sort-icon">↕</span>;
    return <span className="sort-icon">{sort.dir === 1 ? '↑' : '↓'}</span>;
  };

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

  if (!rows || rows.length === 0) return null;

  return (
    <div className="card" style={{ opacity: 0.85 }}>
      <div className="card-header" style={{ borderBottomColor: 'rgba(239,68,68,0.2)' }}>
        <h3 style={{ color: '#f87171' }}>⚠️ Cancelled & Unfinished Bookings</h3>
        <span className="badge-count" style={{ color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.1)' }}>
          {filtered.length} bookings
        </span>
      </div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search cancelled bookings..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className={sort.col === c.key ? 'sorted' : ''} style={c.key === 'price' ? { textAlign: 'right' } : {}} onClick={() => toggle(c.key)}>
                  {c.label} {icon(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr><td colSpan={7}><div className="empty-state"><p>No cancelled bookings match search.</p></div></td></tr>
            ) : (
              pageRows.map((r, i) => (
                <tr key={r.code || i}>
                  <td>{r.date}</td>
                  <td className="c-muted">{r.time}</td>
                  <td className="c-muted">{r.service}</td>
                  <td>{r.provider}</td>
                  <td>{r.client}</td>
                  <td>
                    <span className="badge" style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171', padding: '2px 8px', borderRadius: 12, fontSize: 11 }}>
                      {r.cancellationType || 'Unfinished / $0'}
                    </span>
                    {r.cancelledByAdmin && <span className="c-muted" style={{ fontSize: 10, marginLeft: 6 }}>(by Admin)</span>}
                  </td>
                  <td className="col-right money c-muted">{fmt(r.price)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span className="c-muted">Showing {(safePage - 1) * PAGE_SIZE + 1}–{Math.min(safePage * PAGE_SIZE, sorted.length)} of {sorted.length}</span>
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
