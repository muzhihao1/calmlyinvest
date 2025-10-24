# Phase 2 Testing Guide - Settings Wizard

## 📋 Overview

This guide provides step-by-step instructions for testing the newly implemented Settings Wizard feature (Phase 2). The wizard allows users to configure their investment preferences through a 6-step guided interface.

**Created**: 2025-10-24
**Phase**: Phase 2 - User Preferences System
**Components**: Settings Wizard (6 steps) + API + Database

---

## ✅ Prerequisites

Before testing, ensure:

1. **Database Migration Applied** ✓
   - Migration file: `/supabase/20251024_create_user_preferences.sql`
   - Status: User confirmed migration applied ("可以了")
   - Table `user_preferences` exists in Supabase

2. **Environment Variables Set** ✓
   - `.env` file exists with `SUPABASE_URL` and `SUPABASE_ANON_KEY`
   - `.env.supabase` file exists with `SUPABASE_SERVICE_ROLE_KEY`

3. **Dependencies Installed** ✓
   - Run `npm install` if not done recently

4. **TypeScript Compilation** ✓
   - Fixed Zod schema issue with `updateUserPreferencesSchema`
   - No Phase 2-related TypeScript errors

---

## 🚀 Local Testing Instructions

### Step 1: Start Development Server

```bash
cd /Users/liasiloam/Vibecoding/1MyProducts/CamlyInvest
npm run dev
```

**Expected Output**:
```
VITE v5.x.x  ready in XXX ms
➜  Local:   http://localhost:5173/
➜  Network: use --host to expose

Express server running on http://localhost:5000
```

### Step 2: Login to Application

1. Open browser: `http://localhost:5173`
2. Login with test account:
   - **Demo Account**: username `demo`, password `demo123`
   - **Or use your Supabase Auth account**

**Expected**: Redirect to Dashboard (`/dashboard`)

### Step 3: Navigate to Settings Wizard

Access the wizard through one of these routes:
- `http://localhost:5173/settings`
- `http://localhost:5173/onboarding`

**Expected**: Settings Wizard loads with Step 1 visible

---

## 🧪 Wizard Testing Checklist

### Step 1: Investment Goal (投资目标)

**What to Test**:
- [ ] Page displays 4 investment goal options
- [ ] Each option has icon, English and Chinese labels
- [ ] Can select one goal (radio button behavior)
- [ ] "Continue / 继续" button is enabled
- [ ] Progress bar shows ~17% (1/6 steps)

**Options to Verify**:
1. 📈 Growth / 增长
2. 💰 Income / 收益
3. 🛡️ Capital Preservation / 资本保值
4. ⚖️ Balanced / 平衡

**Test Action**: Select "Balanced" and click Continue

**Expected API Call**:
```
PUT /api/user/preferences
Payload: { investmentGoal: "balanced" }
Response: 200 OK with updated preferences
```

**Expected UI**: Navigate to Step 2

---

### Step 2: Risk Tolerance (风险承受能力)

**What to Test**:
- [ ] Page displays 3 risk tolerance options
- [ ] Each option has icon, English and Chinese labels
- [ ] Can select one option
- [ ] "Back" button returns to Step 1
- [ ] "Continue" button advances to Step 3
- [ ] Progress bar shows ~33% (2/6 steps)

**Options to Verify**:
1. 🐢 Conservative / 保守型
2. 🚶 Moderate / 稳健型
3. 🚀 Aggressive / 激进型

**Test Action**: Select "Moderate" and click Continue

**Expected API Call**:
```
PUT /api/user/preferences
Payload: { riskTolerance: "moderate" }
Response: 200 OK
```

---

### Step 3: Investment Horizon (投资期限)

**What to Test**:
- [ ] Page displays 3 time horizon options
- [ ] Each option has icon, English and Chinese labels
- [ ] Can select one option
- [ ] Progress bar shows ~50% (3/6 steps)

**Options to Verify**:
1. ⚡ Short Term (<1y) / 短期（<1年）
2. 📅 Medium Term (1-5y) / 中期（1-5年）
3. 🎯 Long Term (>5y) / 长期（>5年）

**Test Action**: Select "Long Term" and click Continue

---

### Step 4: Risk Thresholds (风险阈值参数)

**What to Test**:
- [ ] Page displays 5 sliders with current values
- [ ] Each slider has bilingual labels
- [ ] Can adjust slider values
- [ ] Values display correctly as you drag
- [ ] Progress bar shows ~67% (4/6 steps)

**Sliders to Verify**:

1. **Max Leverage Ratio** (最大杠杆)
   - Range: 1.0 - 5.0
   - Step: 0.1
   - Default: 1.5

2. **Max Position Concentration** (最大持仓)
   - Range: 5% - 50%
   - Step: 5%
   - Default: 25%

3. **Max Sector Concentration** (最大行业)
   - Range: 10% - 60%
   - Step: 5%
   - Default: 30%

4. **Min Cash Ratio** (最低现金)
   - Range: 0% - 30%
   - Step: 5%
   - Default: 10%

5. **Max Margin Usage** (最大融资)
   - Range: 0% - 50%
   - Step: 5%
   - Default: 30%

**Test Action**:
- Adjust "Max Leverage Ratio" to 2.0
- Adjust "Min Cash Ratio" to 15%
- Click Continue

**Expected API Call**:
```
PUT /api/user/preferences
Payload: {
  maxLeverageRatio: "2.0",
  minCashRatio: "15"
}
Response: 200 OK
```

---

### Step 5: Sector Preferences (行业偏好)

**What to Test**:
- [ ] Page displays 12 sector options
- [ ] Two tabs: "Prefer / 偏好" and "Avoid / 避免"
- [ ] Can toggle sectors between prefer/avoid/neutral
- [ ] Selected sectors show as badges
- [ ] Progress bar shows ~83% (5/6 steps)

**Sectors to Verify** (12 total):
1. 💻 Technology / 科技
2. 🏥 Healthcare / 医疗
3. 🏦 Financials / 金融
4. 🛍️ Consumer Discretionary / 非必需消费
5. 🛒 Consumer Staples / 必需消费
6. ⚡ Energy / 能源
7. 🏭 Industrials / 工业
8. ⛏️ Materials / 原材料
9. 🏢 Real Estate / 房地产
10. 💡 Utilities / 公用事业
11. 📡 Telecommunications / 电信
12. 🚚 Transportation / 交通运输

**Test Action**:
- In "Prefer" tab: Select Technology, Healthcare, Financials
- In "Avoid" tab: Select Energy, Real Estate
- Click Continue

**Expected API Call**:
```
PUT /api/user/preferences
Payload: {
  sectorPreferences: {
    prefer: ["technology", "healthcare", "financials"],
    avoid: ["energy", "real_estate"]
  }
}
Response: 200 OK
```

---

### Step 6: Confirmation (确认)

**What to Test**:
- [ ] Page displays all preferences in summary cards
- [ ] Investment Goal card shows icon and bilingual label
- [ ] Risk Tolerance card shows icon and bilingual label
- [ ] Investment Horizon card shows icon and bilingual label
- [ ] Risk Thresholds card shows all 5 values correctly
- [ ] Sector Preferences card shows preferred (green badges) and avoided (red badges)
- [ ] Each card has an "Edit" button (pencil icon)
- [ ] "Complete Setup / 完成设置" button is green and prominent
- [ ] Progress bar shows 100% (6/6 steps)

**What to Verify**:

**Investment Goal Card**:
- Icon: ⚖️
- Label: Balanced / 平衡
- Edit button: ✏️

**Risk Tolerance Card**:
- Icon: 🚶
- Label: Moderate / 稳健型
- Edit button: ✏️

**Investment Horizon Card**:
- Icon: 🎯
- Label: Long Term (>5y) / 长期（>5年）
- Edit button: ✏️

**Risk Thresholds Card**:
- Max Leverage: 2.0x
- Max Position: 25%
- Max Sector: 30%
- Min Cash: 15%
- Max Margin: 30%
- Edit button: ✏️

**Sector Preferences Card**:
- Preferred (3): 💻 科技, 🏥 医疗, 🏦 金融
- Avoided (2): ⚡ 能源, 🏢 房地产
- Edit button: ✏️

**Test Edit Functionality**:
- [ ] Click edit button on "Investment Goal" card
- [ ] Verify navigation to Step 1
- [ ] Change selection and continue through wizard
- [ ] Return to Step 6 and verify change reflected

**Final Test Action**: Click "Complete Setup / 完成设置"

**Expected API Call**:
```
PUT /api/user/preferences
Payload: { onboardingCompleted: true }
Response: 200 OK
```

**Expected UI**:
- Redirect to `/dashboard`
- Toast notification: "Preferences saved successfully / 偏好设置已保存"

---

## 🔍 Database Verification

After completing the wizard, verify data in Supabase:

### Check user_preferences Table

**SQL Query**:
```sql
SELECT * FROM user_preferences
WHERE user_id = '<your-user-id>'
ORDER BY updated_at DESC;
```

**Expected Row**:
```sql
user_id: <uuid>
investment_goal: 'balanced'
risk_tolerance: 'moderate'
investment_horizon: 'long_term'
max_leverage_ratio: 2.00
max_concentration_pct: 25.00
max_sector_concentration_pct: 30.00
min_cash_ratio: 15.00
max_margin_usage_pct: 30.00
target_beta: NULL
target_delta: NULL
sector_preferences: {"prefer": ["technology", "healthcare", "financials"], "avoid": ["energy", "real_estate"]}
onboarding_completed: true
created_at: <timestamp>
updated_at: <timestamp>
```

---

## 🐛 Troubleshooting

### Issue: Wizard Doesn't Load

**Symptoms**:
- Blank page at `/settings`
- Console error about missing component

**Possible Causes**:
1. SettingsWizard component not imported in `settings.tsx`
2. Routing not configured in `App.tsx`

**Solution**:
```bash
# Verify files exist
ls -la client/src/pages/settings.tsx
ls -la client/src/components/SettingsWizard/

# Check App.tsx routes
grep -A 5 "/settings" client/src/App.tsx
```

---

### Issue: API 404 Error

**Symptoms**:
- Console error: `GET /api/user/preferences 404`
- No preferences loading

**Possible Causes**:
1. API endpoint not running (Express server)
2. API file missing or misconfigured

**Solution**:
```bash
# Verify API file exists
ls -la api/user/preferences.ts

# Check server logs for route registration
# Should see: "GET /api/user/preferences" in Express output
```

---

### Issue: Database Connection Error

**Symptoms**:
- API returns 500 error
- Console log: "Supabase connection failed"

**Possible Causes**:
1. Environment variables not set
2. Supabase project down
3. RLS policies blocking access

**Solution**:
```bash
# Verify .env file
cat .env | grep SUPABASE

# Test Supabase connection
curl -H "apikey: $SUPABASE_ANON_KEY" \
  "$SUPABASE_URL/rest/v1/user_preferences"
```

**Check RLS Policies**:
```sql
SELECT * FROM pg_policies
WHERE tablename = 'user_preferences';
```

Expected: 4 policies (SELECT, INSERT, UPDATE, DELETE)

---

### Issue: Preferences Not Saving

**Symptoms**:
- Click "Continue" but values don't persist
- Refresh page and values reset

**Possible Causes**:
1. API mutation not triggering
2. Optimistic update not committing
3. Authentication token expired

**Solution**:
1. Open Browser DevTools → Network tab
2. Click "Continue" and verify PUT request
3. Check response status (should be 200)
4. Verify payload matches expected format
5. Check for JWT token in Authorization header

---

### Issue: TypeScript Errors

**Symptoms**:
- Compilation errors about types
- Missing type definitions

**Solution**:
```bash
# Run type check
npm run check

# If errors persist, rebuild
npm run build
```

---

## 📊 Testing Coverage Summary

### ✅ Completed

1. **Database Schema** ✓
   - user_preferences table created
   - RLS policies enabled
   - Indexes configured
   - Trigger functions working

2. **API Endpoints** ✓
   - GET `/api/user/preferences` (fetch)
   - POST `/api/user/preferences` (create)
   - PUT `/api/user/preferences` (update/upsert)
   - Authentication middleware
   - Zod validation

3. **Frontend Hook** ✓
   - useUserPreferences hook
   - TanStack Query integration
   - Optimistic updates
   - Error handling

4. **UI Components** ✓
   - SettingsWizard container (8 files)
   - 6 step components
   - Progress bar
   - Navigation (Back/Continue)
   - Form validation
   - Bilingual labels

5. **Routing** ✓
   - /settings route
   - /onboarding route
   - Protected route wrapper

6. **TypeScript** ✓
   - Fixed schema validation issue
   - No Phase 2-related errors

---

## 📝 User Action Checklist

### Immediate Actions (Required)

- [ ] **Start dev server**: `npm run dev`
- [ ] **Login** with demo account or your account
- [ ] **Navigate to** `/settings` route
- [ ] **Complete wizard** from Step 1 to Step 6
- [ ] **Verify** data saved in Supabase Dashboard
- [ ] **Test edit functionality** by clicking Edit buttons
- [ ] **Test navigation** using Back/Continue buttons

### Verification Actions (Recommended)

- [ ] **Check browser console** for errors
- [ ] **Monitor Network tab** for API calls
- [ ] **Verify database** using Supabase SQL Editor
- [ ] **Test multiple users** (different accounts)
- [ ] **Test existing users** (check defaults vs saved)
- [ ] **Test validation** (try invalid combinations)

### Optional Actions

- [ ] **Test on mobile** viewport (responsive design)
- [ ] **Test accessibility** (keyboard navigation)
- [ ] **Test with slow network** (3G throttling)
- [ ] **Review error messages** (disconnect internet)

---

## 🚀 Next Steps

### After Testing Completes

If testing is successful:

1. **Commit Code to Git** ✓
   ```bash
   git add .
   git commit -m "fix: resolve Zod schema TypeScript error in user preferences"
   git push origin main
   ```

2. **Deploy to Vercel** (Optional)
   - Vercel will auto-deploy on push
   - Verify environment variables set in Vercel dashboard
   - Apply migration to production Supabase

3. **Prepare Phase 3** (AI Logic Engine)
   - RiskEngine implementation
   - RecommendationEngine implementation
   - Integration with user preferences

### If Issues Found

1. **Document the issue**:
   - What step failed?
   - Error messages (screenshot)
   - Browser console logs
   - Network request details

2. **Check troubleshooting section** above

3. **Create GitHub issue** with details

---

## 📞 Support

If you encounter issues not covered in troubleshooting:

1. **Check Documentation**:
   - `/docs/PHASE_2_COMPLETION_REPORT.md`
   - `/docs/PHASE_2_HOOK_USAGE.md`
   - `/docs/MIGRATION_GUIDE.md`

2. **Review Code**:
   - API: `/api/user/preferences.ts`
   - Hook: `/client/src/hooks/use-user-preferences.ts`
   - Components: `/client/src/components/SettingsWizard/`

3. **Database**:
   - Supabase Dashboard → Table Editor
   - Supabase Dashboard → SQL Editor
   - Check RLS policies

---

## 📈 Success Criteria

Phase 2 testing is successful if:

✅ All 6 wizard steps load without errors
✅ User can navigate forward and backward
✅ Preferences save to database on each step
✅ Final confirmation shows all selections correctly
✅ "Complete Setup" redirects to dashboard
✅ Database row created with correct values
✅ Edit buttons allow returning to specific steps
✅ No TypeScript compilation errors
✅ No console errors during normal operation

---

**Testing Guide Created**: 2025-10-24
**Last Updated**: 2025-10-24
**Status**: Ready for User Testing
**Next Phase**: Phase 3 - AI Logic Engine
