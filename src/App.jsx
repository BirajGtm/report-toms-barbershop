// App.jsx — main application shell
import { useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

import { processReport, applyFilters, aggregateRows, buildReconciliation } from './utils/parseReport';
import { KpiGrid }               from './components/KpiGrid';
import { ProviderTable }         from './components/ProviderTable';
import { LocationTable }         from './components/LocationTable';
import { PaymentChart, ProviderChart } from './components/Charts';
import { ReconciliationPanel }   from './components/ReconciliationPanel';
import { BookingsTable }         from './components/BookingsTable';
import { TopClientsTable }       from './components/TopClientsTable';
import { CancelledBookingsTable } from './components/CancelledBookingsTable';

// ── Helpers ──────────────────────────────────────────────────────────────────
function unique(arr) {
  return [...new Set(arr.filter(Boolean))].sort();
}

// ── Upload Zone ───────────────────────────────────────────────────────────────
function UploadZone({ onLoad, loadedName, onReset }) {
  const [drag, setDrag] = useState(false);

  const handleFile = useCallback((file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (name.endsWith('.csv')) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (r) => onLoad(r.data, file.name),
        error:    (e) => alert('CSV error: ' + e.message),
      });
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb   = XLSX.read(e.target.result, { type: 'binary' });
          const ws   = wb.Sheets[wb.SheetNames[0]];
          const data = XLSX.utils.sheet_to_json(ws, { defval: '' });
          onLoad(data, file.name);
        } catch (err) { alert('Excel error: ' + err.message); }
      };
      reader.readAsBinaryString(file);
    } else {
      alert('Please upload a .csv, .xlsx, or .xls file.');
    }
  }, [onLoad]);

  return (
    <section
      className={`upload-zone${drag ? ' drag-over' : ''}`}
      onClick={() => !loadedName && document.getElementById('file-input').click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
    >
      <div className="upload-icon">📊</div>
      <h2>Upload Booking Report</h2>
      <p>Drag & drop your CSV or Excel file here</p>
      {!loadedName ? (
        <>
          <div className="upload-btn">Choose File</div>
          <p style={{ marginTop: 10, fontSize: 12, color: '#475569' }}>
            Supports .csv and .xlsx / .xls
          </p>
        </>
      ) : (
        <div className="loaded-badge">
          ✅ {loadedName}
          <button
            onClick={(e) => { e.stopPropagation(); onReset(); }}
            title="Load a different file"
          >✕</button>
        </div>
      )}
      <input
        id="file-input"
        type="file"
        accept=".csv,.xlsx,.xls"
        style={{ display: 'none' }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </section>
  );
}

// ── Filter Bar ────────────────────────────────────────────────────────────────
function FilterBar({ confirmed, filters, setFilters }) {
  const locations = useMemo(() => unique(confirmed.map((r) => r.location)), [confirmed]);
  const providers = useMemo(() => unique(confirmed.map((r) => r.provider)), [confirmed]);

  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val }));

  const reset = () => {
    const dates = confirmed.map((r) => r.apptDateISO).filter(Boolean).sort();
    setFilters({
      dateFrom: dates[0] || '',
      dateTo:   dates[dates.length - 1] || '',
      location: '',
      provider: '',
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-group">
        <label className="filter-label">Appointment From</label>
        <input className="filter-input" type="date" value={filters.dateFrom}
          onChange={(e) => set('dateFrom', e.target.value)} />
      </div>
      <div className="filter-group">
        <label className="filter-label">Appointment To</label>
        <input className="filter-input" type="date" value={filters.dateTo}
          onChange={(e) => set('dateTo', e.target.value)} />
      </div>
      <div className="filter-group">
        <label className="filter-label">Location</label>
        <select className="filter-select" value={filters.location}
          onChange={(e) => set('location', e.target.value)}>
          <option value="">All Locations</option>
          {locations.map((l) => <option key={l}>{l}</option>)}
        </select>
      </div>
      <div className="filter-group">
        <label className="filter-label">Provider</label>
        <select className="filter-select" value={filters.provider}
          onChange={(e) => set('provider', e.target.value)}>
          <option value="">All Providers</option>
          {providers.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
      <div className="filter-actions">
        <button className="btn btn-ghost" onClick={reset}>Reset</button>
      </div>
    </div>
  );
}

// ── Root App ──────────────────────────────────────────────────────────────────
export default function App() {
  const [loadedName, setLoadedName] = useState('');
  const [report, setReport]         = useState(null);   // { allRows, confirmed }
  const [filters, setFilters]       = useState({
    dateFrom: '', dateTo: '', location: '', provider: '',
  });

  // Load file → process report
  const handleLoad = useCallback((rawRows, filename) => {
    const processed = processReport(rawRows);
    if (processed.confirmed.length === 0) {
      alert(`No completed bookings found in "${filename}".\n\nCheck that the file has "Is cancelled" and "Amount" columns with confirmed rows.`);
      return;
    }
    setReport(processed);
    setLoadedName(filename);

    // Auto-set date range to full file range
    const dates = processed.confirmed.map((r) => r.apptDateISO).filter(Boolean).sort();
    setFilters({ dateFrom: dates[0] || '', dateTo: dates[dates.length - 1] || '', location: '', provider: '' });
  }, []);

  const handleReset = () => {
    setReport(null);
    setLoadedName('');
    setFilters({ dateFrom: '', dateTo: '', location: '', provider: '' });
    // Clear file input so same file can be re-picked
    const inp = document.getElementById('file-input');
    if (inp) inp.value = '';
  };

  // Filtered rows (reactive to filter state)
  const filteredRows = useMemo(() => {
    if (!report) return [];
    return applyFilters(report.confirmed, filters);
  }, [report, filters]);

  const filteredUnconfirmed = useMemo(() => {
    if (!report) return [];
    return applyFilters(report.unconfirmed, filters);
  }, [report, filters]);

  // Aggregated data
  const { totals, byProvider, byLocation, byClient } = useMemo(
    () => aggregateRows(filteredRows),
    [filteredRows]
  );

  // Reconciliation checks
  const checks = useMemo(
    () => (totals ? buildReconciliation(totals, byProvider, byLocation) : []),
    [totals, byProvider, byLocation]
  );

  return (
    <>
      {/* Header */}
      <header className="app-header">
        <div className="header-logo">✂️</div>
        <div>
          <div className="header-text-title">Booking Report Analyzer</div>
          <div className="header-text-sub">Tom's Barbershop · Financial Dashboard</div>
        </div>
      </header>

      <main className="app-main">
        {/* Upload */}
        <UploadZone onLoad={handleLoad} loadedName={loadedName} onReset={handleReset} />

        {report && (
          <>
            {/* Filters */}
            <FilterBar confirmed={report.confirmed} filters={filters} setFilters={setFilters} />

            {filteredRows.length === 0 ? (
              <div className="empty-state" style={{ marginTop: 40 }}>
                <div className="icon">📭</div>
                <p>No confirmed bookings match the current filters.</p>
              </div>
            ) : (
              <>
                {/* KPI Summary */}
                <div className="section-title">📈 Summary</div>
                <KpiGrid totals={totals} />

                {/* Charts */}
                <div className="section-title">📊 Breakdown</div>
                <div className="charts-row">
                  <PaymentChart totals={totals} />
                  <ProviderChart byProvider={byProvider} />
                </div>

                {/* Provider Table */}
                <div className="section-title">✂️ Provider Earnings</div>
                <ProviderTable byProvider={byProvider} />

                {/* Location Table */}
                <div className="section-title">📍 Location Sales</div>
                <LocationTable byLocation={byLocation} />

                {/* Top Clients Table */}
                <div className="section-title">🌟 Top Clients</div>
                <TopClientsTable clients={byClient} />

                {/* Reconciliation (HIDDEN)
                <div className="section-title">🔍 Reconciliation</div>
                <ReconciliationPanel checks={checks} />
                */}

                {/* Bookings Table */}
                <div className="section-title">📋 All Confirmed Bookings</div>
                <BookingsTable rows={filteredRows} />

                {/* Cancelled Bookings Table */}
                {filteredUnconfirmed.length > 0 && (
                  <>
                    <div className="section-title" style={{ marginTop: 40 }}>⚠️ Unfinished</div>
                    <CancelledBookingsTable rows={filteredUnconfirmed} />
                  </>
                )}
              </>
            )}
          </>
        )}
      </main>
    </>
  );
}
