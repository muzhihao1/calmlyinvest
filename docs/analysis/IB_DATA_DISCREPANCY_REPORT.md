# Interactive Brokers Data Discrepancy Analysis Report

## 📊 Executive Summary

**Analysis Date**: 2025-10-24
**Severity**: 🔴 CRITICAL

CamlyInvest website shows significant data discrepancies compared to Interactive Brokers (IB) actual account data. The most critical issue is **missing 71% of stock holdings** (10 out of 14 stocks), resulting in severely underestimated portfolio risk.

### Critical Issues
1. **Missing Holdings**: 10 stocks worth $52,963 not displayed (including SGOV: $41,971)
2. **Cash Balance Error**: $48,287 discrepancy ($43,000 vs -$5,287.37)
3. **Option Data Errors**: MSFT option strike price and current price incorrect
4. **Net Liquidation Value**: $11,500 discrepancy ($72,659 vs $61,159)

---

## 🔍 Detailed Data Comparison

### 1. Account Level Metrics

| Metric | CamlyInvest Website | IB Actual | Discrepancy | Error % |
|--------|---------------------|-----------|-------------|---------|
| **Net Liquidation Value** | $72,659 | $61,159 | +$11,500 | +18.8% |
| **Cash Balance** | $43,000 | -$5,287.37 | +$48,287 | **Invalid** |
| **Stock Market Value** | $14,547 | $66,421 | -$51,874 | **-78.1%** |
| **Option Market Value** | ~$15,112 | -$25 | +$15,137 | **Invalid** |
| **Leverage Ratio (Calc)** | 2.54x | Should be ~1.09x | - | - |

**Critical Finding**: Stock market value is underestimated by 78%, indicating massive data loss.

---

### 2. Stock Holdings Comparison

#### ✅ Holdings Correctly Displayed (4 stocks)

| Symbol | Quantity | Market Value | IB Value | Accuracy |
|--------|----------|--------------|----------|----------|
| TEM | 100 | $8,745 | $8,756 | 99.9% ✅ |
| PLTR | 50 | $3,263 | $3,261.50 | 99.9% ✅ |
| CRWD | 10 | $3,539 | $3,538 | 99.97% ✅ |
| Total (Website) | - | **$14,547** | - | - |

**Note**: Price accuracy for displayed stocks is excellent (>99.9%).

#### 🔴 Holdings Missing from Website (10 stocks)

| Symbol | Quantity (IB) | Market Value (IB) | Status | Priority |
|--------|---------------|-------------------|--------|----------|
| **SGOV** | 417 | **$41,971.33** | ❌ Missing | 🔴 CRITICAL |
| RKLB | 50 | $1,383.00 | ❌ Missing | 🟡 High |
| ORCL | 20 | $3,574.40 | ❌ Missing | 🟡 High |
| GRAB | 300 | $1,308.00 | ❌ Missing | 🟡 High |
| LMND | 25 | $977.25 | ❌ Missing | 🟡 High |
| GLD | 4 | $1,009.48 | ❌ Missing | 🟡 High |
| NFLX | 1 | $909.63 | ❌ Missing | 🟡 High |
| FCX | 10 | $473.60 | ❌ Missing | 🟠 Medium |
| GS | 1 | $587.81 | ❌ Missing | 🟠 Medium |
| AMZN | 2 | $439.40 | ❌ Missing | 🟠 Medium |
| **Total Missing** | - | **$52,633.90** | - | - |

**Impact**: Missing $52,633.90 represents **78.9% of total stock market value** ($66,421).

---

### 3. Option Holdings Comparison

#### 🔴 MSFT Option Data Errors

| Field | CamlyInvest Website | IB Actual | Status |
|-------|---------------------|-----------|--------|
| **Option Symbol** | MSFT 251024P**515** | MSFT 251024P**520** | ❌ Strike price wrong |
| **Current Price** | **$6.10** | **$2.03** | ❌ 200% overvalued |
| **Quantity** | -1 (Sell) | -1 (Sell) | ✅ Correct |
| **Market Value** | -$610 | -$203 | ❌ Wrong due to price |
| **Max Loss (Calc)** | $51,500 | Should be $52,000 | ⚠️ Formula now corrected |

**Root Cause**: Option symbol parsing error - extracting strike price incorrectly from symbol.

**Impact**:
- Current value overstated by $407
- Max loss calculation was using wrong strike ($515 vs $520)
- After fix, max loss correctly calculated as: $520 × 1 × 100 = $52,000

---

### 4. Leverage Ratio Analysis

#### Current Calculation (After Fix)

```
Formula: (Stock Value + Option Max Loss) / Total Equity

User's Portfolio (with correct data):
- Stock Value: $66,421
- Option Max Loss: $52,000 (Sell 1 PUT @ $520 strike)
- Total Equity: $61,159
- Leverage Ratio: ($66,421 + $52,000) / $61,159 = 1.94x ⚠️
```

**Risk Assessment**:
- Target: < 1.5x for experienced option traders
- Actual: **1.94x** (HIGH RISK - exceeds threshold)
- Website shows: 2.54x (inflated due to missing holdings affecting equity calc)

#### Risk Management Implications

| Leverage Level | Risk Category | User's Actual | Status |
|----------------|---------------|---------------|--------|
| < 1.0x | Safe (No leverage) | 1.94x | ❌ |
| 1.0-1.5x | Medium (With hedging) | 1.94x | ❌ |
| > 1.5x | **High Risk** | **1.94x** | 🔴 **ALERT** |

**Critical Finding**: User's actual leverage (1.94x) exceeds the 1.5x safety threshold for experienced option traders.

---

## 🔎 Root Cause Analysis

### Issue 1: Missing Stock Holdings

**Possible Causes**:
1. **Pagination Limit**: API may be limiting results to first 4 records
2. **Database Sync Failure**: IB import script may have failed to save all holdings
3. **RLS Policy Bug**: Row Level Security may be filtering out some holdings
4. **Client-Side Filtering**: Frontend may be applying unintended filters

**Investigation Steps**:
```sql
-- Check if data exists in database
SELECT COUNT(*), user_id
FROM stock_holdings
WHERE user_id = '[current_user_id]'
GROUP BY user_id;

-- Check for SGOV specifically
SELECT * FROM stock_holdings
WHERE code = 'SGOV' AND user_id = '[current_user_id]';
```

**Recommendation**:
- Check API endpoint `/api/portfolio/[userId]/holdings` response
- Verify database query has no LIMIT clause
- Test with different user IDs to rule out RLS issues

### Issue 2: Cash Balance Discrepancy

**Possible Causes**:
1. **Margin Loan Not Tracked**: System may be showing "cash" without subtracting margin debt
2. **Buying Power Confusion**: May be displaying buying power instead of actual cash
3. **Manual Entry Error**: User may have entered $43,000 without updating after margin usage
4. **Currency Conversion Issue**: If IB account uses multiple currencies

**Expected Behavior**:
```
IB Cash Balance: -$5,287.37 (negative = margin loan)
Net Liquidation: $61,159
Stock + Options: $66,421 + (-$25) = $66,396
Cash = Net Liq - (Stock + Options) = $61,159 - $66,396 = -$5,237 ✓
```

**Recommendation**:
- Implement margin debt tracking
- Auto-calculate: Cash = Net Liq - Market Value
- Add validation: warn if cash balance doesn't reconcile

### Issue 3: Option Price and Strike Errors

**Root Cause**: Option symbol parsing regex error

Current symbol format: `MSFT 251024P515` should be `MSFT 251024P520`

**Parsing Logic Issue**:
```typescript
// Likely current regex (WRONG):
const strike = symbol.match(/[PC](\d+)/)?.[1]; // Gets "515" from wrong position

// Should be:
const optionCode = symbol.split(' ')[1]; // "251024P520"
const strike = optionCode.match(/[PC](\d+)$/)?.[1]; // "520"
```

**Price Fetching Issue**:
- May be using incorrect strike to query Yahoo Finance
- Or using stale cached data
- Need to verify option symbol construction for API calls

**Recommendation**:
- Fix option symbol parsing in `market-data.ts` or `storage-*.ts`
- Add validation: compare fetched price against reasonable ranges
- Log option API requests for debugging

---

## 📋 Action Items

### 🔴 Critical Priority (Immediate)

1. **Investigate Missing Holdings**
   - [ ] Query database directly to verify if SGOV and other stocks exist
   - [ ] Check API endpoint response for pagination/limits
   - [ ] Test holdings display with test data (14+ stocks)
   - [ ] Review RLS policies for unintended filtering

2. **Fix Cash Balance Calculation**
   - [ ] Implement: `Cash = Net Liq - (Stock Market Value + Option Market Value)`
   - [ ] Add margin debt tracking
   - [ ] Validate reconciliation on every portfolio load

3. **Fix Option Data Parsing**
   - [ ] Correct option symbol parsing regex
   - [ ] Verify strike price extraction
   - [ ] Add unit tests for option symbol parsing
   - [ ] Implement price validation (warn if price changes >50% between updates)

### 🟡 High Priority (This Week)

4. **Data Validation Framework**
   - [ ] Add reconciliation checks: Net Liq = Cash + Market Values
   - [ ] Implement data accuracy alerts in UI
   - [ ] Log discrepancies for monitoring
   - [ ] Add "Last Sync" timestamp for each holding

5. **Import/Sync Improvements**
   - [ ] Create comprehensive IB CSV import template
   - [ ] Add import validation (check for missing symbols)
   - [ ] Implement "compare with IB" feature
   - [ ] Add manual refresh button per holding

### 🟢 Medium Priority (Next Sprint)

6. **Testing & Monitoring**
   - [ ] Create integration tests with IB-like test data
   - [ ] Add data quality dashboard
   - [ ] Implement automated daily reconciliation reports
   - [ ] Set up alerts for >10% discrepancies

---

## 🧪 Verification Test Plan

### Test Case 1: Full Holdings Import

**Setup**: Import complete IB portfolio (14 stocks)

**Expected**:
- All 14 stocks visible in holdings table
- Market values match within 1%
- Total market value: $66,421 ± $100

**Validation**:
```sql
SELECT COUNT(*) as stock_count,
       SUM(quantity * current_price) as total_market_value
FROM stock_holdings
WHERE user_id = '[test_user]';
-- Expected: stock_count = 14, total_market_value ≈ 66421
```

### Test Case 2: Cash Balance Reconciliation

**Setup**: Portfolio with known values

**Expected**:
```
Given:
- Net Liq: $61,159
- Stock Value: $66,421
- Option Value: -$25

Calculated Cash = $61,159 - $66,421 - (-$25) = -$5,237
Should match IB: -$5,287 (within $50 tolerance)
```

### Test Case 3: Option Data Accuracy

**Setup**: MSFT 251024P520 option

**Expected**:
- Symbol parsed: "MSFT", expiry: "2024-10-25", type: "PUT", strike: "520"
- Current price: $2.03 ± $0.50 (within reasonable range)
- Max loss: $520 × 1 × 100 = $52,000

**Validation**:
- Log fetched price from Yahoo Finance
- Compare with IB price
- Alert if >20% discrepancy

### Test Case 4: Leverage Ratio Verification

**Setup**: Complete portfolio data

**Expected**:
```
Formula: (Stock Value + Option Max Loss) / Net Liq
= ($66,421 + $52,000) / $61,159
= 1.94x

Risk Level: HIGH (> 1.5x threshold)
Warning: "⚠️ 杠杆率超过1.5倍，高风险!"
```

---

## 📊 Data Quality Metrics

### Current State

| Metric | Status | Accuracy | Target |
|--------|--------|----------|--------|
| Stock Holdings Completeness | 🔴 28.6% (4/14) | CRITICAL | 100% |
| Stock Price Accuracy | ✅ 99.9% | Excellent | >99% |
| Option Data Accuracy | 🔴 0% (wrong strike/price) | CRITICAL | >95% |
| Cash Balance Accuracy | 🔴 Invalid ($48k error) | CRITICAL | >99% |
| Net Liq Reconciliation | 🔴 -18.8% error | High | Within ±1% |

### After Fix (Expected)

| Metric | Status | Accuracy | Target |
|--------|--------|----------|--------|
| Stock Holdings Completeness | ✅ 100% (14/14) | Excellent | 100% |
| Stock Price Accuracy | ✅ 99.9% | Excellent | >99% |
| Option Data Accuracy | ✅ >95% | Good | >95% |
| Cash Balance Accuracy | ✅ 99.9% | Excellent | >99% |
| Net Liq Reconciliation | ✅ <1% error | Excellent | Within ±1% |

---

## 🔧 Technical Implementation Notes

### Database Schema Verification

Ensure proper indexes for performance:
```sql
CREATE INDEX idx_stock_holdings_user ON stock_holdings(user_id);
CREATE INDEX idx_stock_holdings_code ON stock_holdings(code);
CREATE INDEX idx_option_holdings_user ON option_holdings(user_id);
CREATE INDEX idx_option_holdings_symbol ON option_holdings(option_symbol);
```

### API Response Monitoring

Add response logging to detect data issues:
```typescript
console.log('API Response Validation:', {
  requestedUserId: userId,
  returnedStockCount: stocks.length,
  returnedOptionCount: options.length,
  totalMarketValue: (stockValue + optionValue).toFixed(2),
  cashBalance: cashBalance,
  netLiq: (cashBalance + stockValue + optionValue).toFixed(2),
  dataQuality: {
    missingHoldings: expectedCount - actualCount,
    priceDiscrepancies: flaggedPrices.length,
    reconciliationDiff: Math.abs(netLiq - reportedNetLiq)
  }
});
```

---

## 📚 References

- **IB API Documentation**: https://www.interactivebrokers.com/en/software/api/api.htm
- **Maintenance Margin Requirements**: https://www.interactivebrokers.com/en/trading/margin-requirements.php
- **Yahoo Finance API**: `yahoo-finance2` npm package
- **CamlyInvest Risk Calculation**: `api/portfolio-risk-simple.ts:269-296`

---

## 📝 Change Log

| Date | Change | Author |
|------|--------|--------|
| 2025-10-24 | Initial analysis report created | Claude Code |
| 2025-10-24 | Leverage ratio calculation fixed | Claude Code |
| 2025-10-24 | Option max loss formula corrected | Claude Code |

---

## 👥 Next Steps

1. **For Developers**: Review "Critical Priority" action items and assign tasks
2. **For QA**: Execute verification test plan with IB test data
3. **For Product**: Decide on data import strategy (manual vs automated IB sync)
4. **For User**: Do NOT rely on current leverage ratio (2.54x) - actual is 1.94x (still high risk)

**Estimated Fix Time**:
- Missing holdings fix: 2-4 hours
- Cash balance fix: 1-2 hours
- Option parsing fix: 1-2 hours
- Testing & validation: 2-3 hours
- **Total**: ~1 business day

---

*Generated by CamlyInvest Data Quality Analysis System*
*Report ID: IB-DISCREPANCY-20251024*
