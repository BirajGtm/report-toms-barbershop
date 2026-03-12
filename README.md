# Tom's Barbershop — Booking Report Analyzer

A comprehensive, standalone React specific financial dashboard built to accurately parse and visualize booking exports from Tom's Barbershop.

## 🚀 Getting Started

To run the application locally:

```bash
npm install
npm run dev
```

Then open `http://localhost:5174` in your browser.

---

## 📊 Core Business Logic

Due to the nature of barbershop payouts, basic summations of exported columns result in massive inaccuracies. This engine applies rigorous parsing rules to guarantee 100% financial accuracy.

### 1. Booking Classification

Every row imported via CSV/Excel is classified into one of two buckets: **Confirmed** or **Unfinished**.

**✅ Confirmed Bookings (Revenue Generating)**
Included in all KPIs, Provider Tables, and Location Sales. A booking is confirmed if it is **not cancelled** AND one of the following is true:

- The post-tax `Amount` collected is > $0
- The `Tips amount` collected is > $0 _(Protects $0/comped services where the client tipped in cash at the chair)_

**⚠️ Unfinished / Cancelled**
Completely excluded from revenue data to prevent inflated numbers. Appears only in the "Unfinished" safety table.

- The booking `Is cancelled` = "Yes" (By admin, client, etc.)
- The booking was never officially cancelled, but `Amount` = $0 and `Tips amount` = $0 (Ghost/Pending/No-Show).

### 2. Money Definitions

- **Price (Pre-tax):** The base value of the service performed.
- **Amount (Service Revenue):** The exact post-tax amount the shop charged the client. (Note: Some "Pay Later" bookings apply tax at the POS, meaning their exported `Amount` = `Price`).
- **HST Collected:** Calculated dynamically as `max(Amount - Price, 0)`.
- **Tips:** Pulled exclusively from the `Tips amount` column.

### 3. Provider Earnings Protection

The most critical function of this dashboard is ensuring providers are paid accurately and do not lose their untaxed tips.

1. **Tips are never mixed with revenue:** Tips are completely separated from the invoice `Amount`.
2. **100% credited to provider:** The provider earnings table calculates:
   _Service Revenue (Amount) + Tips = Total Earned_
3. **Comped haircut safety net:** As noted above, if a provider comps a haircut ($0 service revenue) but walks away with a cash tip, this engine correctly classifies the booking as "Confirmed" and assigns the tip to the provider.

### 4. Payment Methods

Payment mapping logic categorizes the `Payment processor` string into:

- `"Cash"` → **Cash**
- `"stripe"` → **Online (Stripe)**
- `"delay"` → **Pay Later** _(Invoice created, payment not processed online)_
- _Empty_ → **Unspecified**

---

## 🛠 Tech Stack

- **Framework:** React 18 + Vite
- **Data Parsing:** PapaParse (CSV) + SheetJS (XLSX, XLS)
- **Visualizations:** Chart.js + react-chartjs-2
- **Styling:** Custom CSS + Glassmorphism UI
