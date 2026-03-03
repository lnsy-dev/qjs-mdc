---
publish: true
title: "SVG Debug: Heikin-Ashi Chart"
date: 2026-02-27T00:00:00
tags:
  - debug
  - svg
  - heikin-ashi
---

# Heikin-Ashi Charts

Testing heikin-ashi candlestick rendering with OHLC data.

## 20-Day Price Action

Simulated stock data showing a downtrend, reversal, and uptrend.

```heikin-ashi
[
  {"date": "2026-01-05", "open": 150.00, "high": 153.20, "low": 149.50, "close": 152.80},
  {"date": "2026-01-06", "open": 152.80, "high": 155.10, "low": 152.00, "close": 154.60},
  {"date": "2026-01-07", "open": 154.60, "high": 156.30, "low": 153.80, "close": 154.20},
  {"date": "2026-01-08", "open": 154.20, "high": 154.90, "low": 151.40, "close": 152.10},
  {"date": "2026-01-09", "open": 152.10, "high": 152.80, "low": 149.20, "close": 149.80},
  {"date": "2026-01-12", "open": 149.80, "high": 150.60, "low": 147.30, "close": 148.10},
  {"date": "2026-01-13", "open": 148.10, "high": 148.90, "low": 145.50, "close": 146.20},
  {"date": "2026-01-14", "open": 146.20, "high": 147.80, "low": 144.90, "close": 145.30},
  {"date": "2026-01-15", "open": 145.30, "high": 146.10, "low": 143.80, "close": 144.50},
  {"date": "2026-01-16", "open": 144.50, "high": 146.80, "low": 144.00, "close": 146.40},
  {"date": "2026-01-20", "open": 146.40, "high": 148.90, "low": 146.10, "close": 148.50},
  {"date": "2026-01-21", "open": 148.50, "high": 150.70, "low": 148.20, "close": 150.30},
  {"date": "2026-01-22", "open": 150.30, "high": 153.10, "low": 150.00, "close": 152.80},
  {"date": "2026-01-23", "open": 152.80, "high": 155.40, "low": 152.50, "close": 155.10},
  {"date": "2026-01-26", "open": 155.10, "high": 157.60, "low": 154.80, "close": 157.20},
  {"date": "2026-01-27", "open": 157.20, "high": 159.30, "low": 156.90, "close": 158.80},
  {"date": "2026-01-28", "open": 158.80, "high": 160.50, "low": 158.10, "close": 159.90},
  {"date": "2026-01-29", "open": 159.90, "high": 162.20, "low": 159.40, "close": 161.70},
  {"date": "2026-01-30", "open": 161.70, "high": 163.80, "low": 161.20, "close": 163.40},
  {"date": "2026-02-02", "open": 163.40, "high": 165.10, "low": 162.80, "close": 164.60}
]
```

The heikin-ashi chart smooths OHLC price action. Bullish candles (close > open) and bearish candles (close < open) are distinguished by pattern fill. Wicks show high/low range.

## Short Dataset with Custom Size

Minimal 5-candle chart for edge-case testing.

```heikin-ashi
---
width: 400
height: 250
---
[
  {"date": "2026-02-23", "open": 200.00, "high": 205.50, "low": 198.20, "close": 204.30},
  {"date": "2026-02-24", "open": 204.30, "high": 208.10, "low": 203.80, "close": 207.50},
  {"date": "2026-02-25", "open": 207.50, "high": 210.20, "low": 206.10, "close": 206.80},
  {"date": "2026-02-26", "open": 206.80, "high": 207.40, "low": 202.50, "close": 203.10},
  {"date": "2026-02-27", "open": 203.10, "high": 205.80, "low": 201.90, "close": 205.20}
]
```

## Without Date Labels

Heikin-ashi data with no `date` field; x-axis uses indices.

```heikin-ashi
[
  {"open": 100, "high": 108, "low": 98, "close": 106},
  {"open": 106, "high": 112, "low": 104, "close": 110},
  {"open": 110, "high": 115, "low": 109, "close": 114},
  {"open": 114, "high": 118, "low": 112, "close": 113},
  {"open": 113, "high": 116, "low": 110, "close": 111},
  {"open": 111, "high": 113, "low": 107, "close": 108},
  {"open": 108, "high": 111, "low": 106, "close": 110},
  {"open": 110, "high": 114, "low": 109, "close": 113}
]
```
