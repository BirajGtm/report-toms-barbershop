import { useState, useMemo } from 'react';

const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

const PAGE_SIZE = 15;

const COLS = [
  { key: 'name',       label: 'Client Name', align: 'left' },
  { key: 'email',      label: 'Email',       align: 'left' },
  { key: 'phone',      label: 'Phone',       align: 'left' },
  { key: 'visits',     label: 'Visits',      align: 'right' },
  { key: 'revenue',    label: 'Total Spends (Service)', align: 'right' },
  { key: 'tips',       label: 'Total Tips',  align: 'right' },
  { key: 'totalSpend', label: 'Grand Total', align: 'right' },
  { key: 'lastVisit',  label: 'Last Visit',  align: 'right' },
];

export function TopClientsTable({ clients }) {
  const [sort, setSort] = useState({ col: 'totalSpend', dir: -1 });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return clients;
    return clients.filter(c => 
      c.name.toLowerCase().includes(q) || 
      c.email.toLowerCase().includes(q) || 
      c.phone.toLowerCase().includes(q)
    );
  }, [clients, search]);

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

  const totalRevenue = useMemo(() => filtered.reduce((sum, c) => sum + c.revenue, 0), [filtered]);
  const totalTips = useMemo(() => filtered.reduce((sum, c) => sum + c.tips, 0), [filtered]);
  const grandTotal = useMemo(() => filtered.reduce((sum, c) => sum + c.totalSpend, 0), [filtered]);

  // Pagination buttons logic...
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

  if (!clients || clients.length === 0) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h3>🌟 Top Clients Dashboard</h3>
        <span className="badge-count">{filtered.length} clients</span>
      </div>
      <div className="search-bar">
        <input
          className="search-input"
          placeholder="Search clients by name, email, or phone..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {COLS.map(c => (
                <th key={c.key} className={sort.col === c.key ? 'sorted' : ''} style={{ textAlign: c.align }} onClick={() => toggle(c.key)}>
                  {c.label} {icon(c.key)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c, i) => (
              <tr key={c.id || i}>
                <td><strong>{c.name}</strong></td>
                <td className="c-muted">{c.email || '—'}</td>
                <td className="c-muted">{c.phone || '—'}</td>
                <td className="col-right">{c.visits}</td>
                <td className="col-right money c-green">{fmt(c.revenue)}</td>
                <td className="col-right money c-purple">{c.tips > 0 ? fmt(c.tips) : <span className="c-muted">—</span>}</td>
                <td className="col-right money c-amber"><strong>{fmt(c.totalSpend)}</strong></td>
                <td className="col-right c-muted">{c.lastVisit || '—'}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr><td colSpan={8}><div className="empty-state"><div className="icon">🔍</div><p>No clients match your search.</p></div></td></tr>
            )}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={3}>FILTERED TOTALS</td>
              <td className="col-right">{filtered.reduce((s, c) => s + c.visits, 0)}</td>
              <td className="col-right money">{fmt(totalRevenue)}</td>
              <td className="col-right money">{fmt(totalTips)}</td>
              <td className="col-right money">{fmt(grandTotal)}</td>
              <td></td>
            </tr>
          </tfoot>
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
