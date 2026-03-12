// Charts.jsx
import { Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const fmt = (n) => '$' + Number(n || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// ── Payment Doughnut ──────────────────────────────────────────────────────────
export function PaymentChart({ totals }) {
  const entries = [
    { label: 'Cash',           value: totals.cash,     color: '#f59e0b' },
    { label: 'Online (Stripe)',value: totals.stripe,   color: '#3b82f6' },
    { label: 'Pay Later',      value: totals.paylater, color: '#ec4899' },
    { label: 'Unspecified',    value: totals.other,    color: '#64748b' },
  ].filter((e) => e.value > 0);

  const data = {
    labels: entries.map((e) => e.label),
    datasets: [{
      data:            entries.map((e) => e.value),
      backgroundColor: entries.map((e) => e.color),
      borderColor:     '#13161e',
      borderWidth:     3,
      hoverOffset:     8,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { color: '#94a3b8', font: { size: 12 }, padding: 14, boxWidth: 12 },
      },
      tooltip: { callbacks: { label: (c) => ` ${c.label}: ${fmt(c.raw)}` } },
    },
  };

  return (
    <div className="chart-card">
      <h3>💳 Payment Methods</h3>
      <div className="chart-wrap">
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
}

// ── Provider Bar Chart ────────────────────────────────────────────────────────
const PALETTE = ['#f59e0b','#3b82f6','#10b981','#8b5cf6','#ec4899','#f97316','#06b6d4','#a3e635'];

export function ProviderChart({ byProvider }) {
  const sorted = [...(byProvider || [])].sort((a, b) => b.revenue - a.revenue);
  const labels   = sorted.map((r) => r.provider);

  const data = {
    labels,
    datasets: [
      {
        label: 'Service Revenue',
        data:  sorted.map((r) => parseFloat(r.revenue.toFixed(2))),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + 'cc'),
        borderColor:     labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: 'Tips',
        data:  sorted.map((r) => parseFloat(r.tips.toFixed(2))),
        backgroundColor: labels.map((_, i) => PALETTE[i % PALETTE.length] + '55'),
        borderColor:     labels.map((_, i) => PALETTE[i % PALETTE.length]),
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { size: 12 } } },
      tooltip: { callbacks: { label: (c) => ` ${c.dataset.label}: ${fmt(c.raw)}` } },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
      y: {
        grid: { color: 'rgba(255,255,255,0.05)' },
        ticks: { color: '#94a3b8', callback: (v) => '$' + v.toLocaleString() },
      },
    },
  };

  return (
    <div className="chart-card">
      <h3>👤 Revenue by Provider</h3>
      <div className="bar-wrap">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
