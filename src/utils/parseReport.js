/**
 * parseReport.js
 * Core data processing engine for the booking report analyzer.
 *
 * KEY BUSINESS RULES:
 *  - Confirmed booking = Is cancelled === "No" AND Amount > 0
 *  - Price  = pre-tax base price
 *  - Amount = post-tax charged amount (Price × 1.13 when tax applied; sometimes = Price for Pay Later)
 *  - HST   = max(Amount - Price, 0)
 *  - Tips  = standalone column, NEVER included in Amount; 100% goes to provider (not taxed)
 *  - Total client paid = Amount + Tips
 *  - Provider earnings = Amount (service revenue) + Tips (full tip, no deductions)
 */

// ── Flexible column key lookup ────────────────────────────────────────────────
function getVal(row, ...keys) {
  for (const key of keys) {
    for (const rk of Object.keys(row)) {
      if (rk.trim().toLowerCase() === key.toLowerCase()) {
        const v = row[rk];
        return v != null ? String(v).trim() : "";
      }
    }
  }
  return "";
}

function safeNum(str) {
  const n = parseFloat(str);
  return isNaN(n) ? 0 : n;
}

// ── Parse appointment date from "Thursday, Mar 12 2026" ───────────────────────
function parseApptDate(dateStr) {
  if (!dateStr) return null;
  // Strip the day-of-week prefix
  const cleaned = dateStr.replace(/^[A-Za-z]+,\s*/, "").trim();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d) {
  if (!d) return "";
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

// ── Classify payment method ───────────────────────────────────────────────────
export function classifyPayment(raw) {
  const s = (raw || "").toLowerCase().trim();
  if (s === "cash") return "cash";
  if (s === "stripe") return "stripe";
  if (s === "delay") return "paylater";
  return "other";
}

export const PAYMENT_LABELS = {
  cash: "Cash",
  stripe: "Online (Stripe)",
  paylater: "Pay Later",
  other: "Unspecified",
};

// ── Normalise a single raw CSV/Excel row ──────────────────────────────────────
export function normalizeRow(raw) {
  const isCancelled =
    getVal(raw, "Is cancelled", "is cancelled", "cancelled").toLowerCase() ===
    "yes";
  const amount = safeNum(getVal(raw, "Amount", "amount"));
  const price = safeNum(getVal(raw, "Price", "price"));
  const tips = safeNum(getVal(raw, "Tips amount", "tips amount", "tips"));
  const hst = Math.max(0, parseFloat((amount - price).toFixed(4)));
  const payRaw = getVal(
    raw,
    "Payment processor",
    "payment processor",
    "Paid via",
  );
  const dateStr = getVal(raw, "Date", "date");
  const apptDate = parseApptDate(dateStr);

  return {
    // Appointment info
    date: dateStr,
    time: getVal(raw, "Time", "time"),
    apptDate,
    apptDateISO: toISO(apptDate),

    // Service / provider / location
    service: getVal(raw, "Service", "service"),
    provider:
      getVal(raw, "Service provider", "service provider") || "Unassigned",
    location: getVal(raw, "Location", "location") || "Unknown",
    code: getVal(raw, "Code", "code"),

    // Client
    client: getVal(raw, "Client name", "client name") || "—",
    email: getVal(raw, "Client email", "client email"),
    phone: getVal(raw, "Client phone", "client phone"),

    // Cancellation
    isCancelled,
    cancellationType: getVal(raw, "Cancellation type", "cancellation type"),
    cancelledByAdmin:
      getVal(raw, "Canceled by admin", "canceled by admin").toLowerCase() ===
      "yes",

    // Money
    price, // pre-tax base
    amount, // post-tax charged amount
    hst, // Amount − Price (≥ 0)
    tips, // 100% to provider, not taxed
    total: parseFloat((amount + tips).toFixed(4)), // total client paid

    // Payment
    paymentRaw: payRaw,
    payment: classifyPayment(payRaw),
  };
}

// ── Main processing function ──────────────────────────────────────────────────
/**
 * @param {Object[]} rawRows - rows from PapaParse or SheetJS
 * @returns {Object} processed data ready for the dashboard
 */
export function processReport(rawRows) {
  const allRows = rawRows.map(normalizeRow);

  // CONFIRMED: not cancelled AND (amount collected OR tips collected)
  // This guarantees a $0 comped haircut with a cash tip is counted as a completed service
  // so the provider still gets their tip on the dashboard.
  const confirmed = allRows.filter(
    (r) => !r.isCancelled && (r.amount > 0 || r.tips > 0),
  );

  // UNFINISHED: cancelled OR ($0 amount AND $0 tips)
  const unconfirmed = allRows.filter(
    (r) => r.isCancelled || (r.amount === 0 && r.tips === 0),
  );

  return {
    allRows,
    confirmed,
    unconfirmed,
  };
}

// ── Filter rows by UI filter state ──────────────────────────────────
export function applyFilters(rows, { dateFrom, dateTo, location, provider }) {
  return rows.filter((r) => {
    if (dateFrom && r.apptDateISO < dateFrom) return false;
    if (dateTo && r.apptDateISO > dateTo) return false;
    if (location && r.location !== location) return false;
    if (provider && r.provider !== provider) return false;
    return true;
  });
}

// ── Aggregate totals from a filtered row set ──────────────────────────────────
export function aggregateRows(rows) {
  const totals = {
    bookings: rows.length,
    revenue: 0, // sum of Amount
    pretax: 0, // sum of Price
    hst: 0, // sum of HST
    tips: 0, // sum of Tips
    total: 0, // revenue + tips (total client paid)
    cash: 0,
    stripe: 0,
    paylater: 0,
    other: 0,
  };

  const byProvider = {};
  const byLocation = {};
  const byClient = {};

  for (const r of rows) {
    totals.revenue += r.amount;
    totals.pretax += r.price;
    totals.hst += r.hst;
    totals.tips += r.tips;
    totals.total += r.total;

    // Payment buckets
    totals[r.payment] = (totals[r.payment] || 0) + r.amount;

    // ── Per-client (Top Clients) ─────────────────────────────────────────────
    // Identify client primarily by email, then phone, then name.
    let clientId = (r.email || "").trim().toLowerCase();
    if (!clientId) clientId = (r.phone || "").trim().replace(/[^0-9]/g, "");
    if (!clientId) clientId = (r.client || "").trim().toLowerCase();
    if (!clientId) clientId = "unknown_client";

    if (!byClient[clientId]) {
      byClient[clientId] = {
        id: clientId,
        name: r.client || "Unknown",
        email: r.email || "",
        phone: r.phone || "",
        visits: 0,
        revenue: 0,
        tips: 0,
        totalSpend: 0,
        lastVisit: r.date,
      };
    }
    const c = byClient[clientId];
    c.visits++;
    c.revenue += r.amount;
    c.tips += r.tips;
    c.totalSpend += r.total;
    // Simple last visit tracking
    if (r.apptDateISO && (!c.lastVisitISO || r.apptDateISO > c.lastVisitISO)) {
      c.lastVisitISO = r.apptDateISO;
      c.lastVisit = r.date;
    }

    // ── Per-provider ─────────────────────────────────────────────────────────
    if (!byProvider[r.provider]) {
      byProvider[r.provider] = {
        provider: r.provider,
        bookings: 0,
        revenue: 0, // post-tax service charge (Amount)
        pretax: 0, // pre-tax base (Price)
        hst: 0,
        tips: 0, // 100% theirs, no tax
        total: 0, // revenue + tips = everything they earned
        cash: 0,
        stripe: 0,
        paylater: 0,
        other: 0,
      };
    }
    const p = byProvider[r.provider];
    p.bookings++;
    p.revenue += r.amount;
    p.pretax += r.price;
    p.hst += r.hst;
    p.tips += r.tips;
    p.total += r.total;
    p[r.payment] = (p[r.payment] || 0) + r.amount;

    // ── Per-location ─────────────────────────────────────────────────────────
    if (!byLocation[r.location]) {
      byLocation[r.location] = {
        location: r.location,
        bookings: 0,
        revenue: 0,
        pretax: 0,
        hst: 0,
        tips: 0,
        total: 0,
        cash: 0,
        stripe: 0,
        paylater: 0,
        other: 0,
      };
    }
    const l = byLocation[r.location];
    l.bookings++;
    l.revenue += r.amount;
    l.pretax += r.price;
    l.hst += r.hst;
    l.tips += r.tips;
    l.total += r.total;
    l[r.payment] = (l[r.payment] || 0) + r.amount;
  }

  // Round all aggregated money values to 2dp
  const round = (obj) => {
    for (const k of Object.keys(obj)) {
      if (typeof obj[k] === "number" && k !== "bookings") {
        obj[k] = parseFloat(obj[k].toFixed(2));
      }
    }
  };

  round(totals);
  Object.values(byProvider).forEach(round);
  Object.values(byLocation).forEach(round);
  Object.values(byClient).forEach(round);

  return {
    totals,
    byProvider: Object.values(byProvider),
    byLocation: Object.values(byLocation),
    byClient: Object.values(byClient).sort(
      (a, b) => b.totalSpend - a.totalSpend,
    ),
  };
}

// ── Build a reconciliation check ─────────────────────────────────────────────
/**
 * Returns a list of check items so the UI can display a verification panel.
 * Each item: { label, expected, actual, pass }
 */
export function buildReconciliation(totals, byProvider, byLocation) {
  const checks = [];

  const sumProv = (key) => byProvider.reduce((s, p) => s + (p[key] || 0), 0);
  const sumLoc = (key) => byLocation.reduce((s, l) => s + (l[key] || 0), 0);
  const approx = (a, b) => Math.abs(a - b) < 0.02; // ±2¢ tolerance for float rounding

  // 1. Provider booking count = total booking count
  checks.push({
    label: "Σ Provider bookings = Total bookings",
    expected: totals.bookings,
    actual: byProvider.reduce((s, p) => s + p.bookings, 0),
    fmt: "count",
  });

  // 2. Provider revenues sum = total revenue
  checks.push({
    label: "Σ Provider revenue = Total revenue",
    expected: totals.revenue,
    actual: parseFloat(sumProv("revenue").toFixed(2)),
    fmt: "money",
  });

  // 3. Provider tips sum = total tips
  checks.push({
    label: "Σ Provider tips = Total tips",
    expected: totals.tips,
    actual: parseFloat(sumProv("tips").toFixed(2)),
    fmt: "money",
  });

  // 4. Provider totals (revenue+tips) sum = grand total
  checks.push({
    label: "Σ Provider totals = Total client spend",
    expected: totals.total,
    actual: parseFloat(sumProv("total").toFixed(2)),
    fmt: "money",
  });

  // 5. Location booking count = total
  checks.push({
    label: "Σ Location bookings = Total bookings",
    expected: totals.bookings,
    actual: byLocation.reduce((s, l) => s + l.bookings, 0),
    fmt: "count",
  });

  // 6. Location revenues sum = total revenue
  checks.push({
    label: "Σ Location revenue = Total revenue",
    expected: totals.revenue,
    actual: parseFloat(sumLoc("revenue").toFixed(2)),
    fmt: "money",
  });

  // 7. Cash + Stripe + PayLater + Other = Total revenue
  const paySum = parseFloat(
    (totals.cash + totals.stripe + totals.paylater + totals.other).toFixed(2),
  );
  checks.push({
    label: "Cash + Stripe + Pay Later + Other = Total revenue",
    expected: totals.revenue,
    actual: paySum,
    fmt: "money",
  });

  // 8. Pre-tax + HST = Revenue (approximately, since delay bookings may have no HST)
  checks.push({
    label: "Pre-tax + HST ≈ Revenue (where tax applied)",
    expected: totals.revenue,
    actual: parseFloat((totals.pretax + totals.hst).toFixed(2)),
    fmt: "money",
    note: "May differ if some Pay Later bookings have Amount = Price (tax added at POS)",
  });

  // Mark pass/fail
  return checks.map((c) => ({
    ...c,
    pass: approx(c.expected, c.actual),
  }));
}
