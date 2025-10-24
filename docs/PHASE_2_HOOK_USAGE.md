# useUserPreferences Hook - Usage Guide

**Created**: 2025-10-24
**File**: `/client/src/hooks/use-user-preferences.ts`
**Phase**: 2.2 - Frontend Hook Implementation

---

## Overview

The `useUserPreferences` hook provides a complete interface for managing user investment preferences using TanStack Query. It handles:

- ✅ Fetching preferences (with defaults for new users)
- ✅ Creating new preferences (first-time onboarding)
- ✅ Updating preferences (with optimistic updates)
- ✅ Automatic caching and synchronization
- ✅ Loading states and error handling
- ✅ Toast notifications for user feedback

---

## Installation & Dependencies

The hook is already integrated with the project's existing dependencies:

```typescript
import { useUserPreferences } from "@/hooks/use-user-preferences";
```

**Dependencies** (already in project):
- `@tanstack/react-query` - Data fetching and caching
- `@/lib/queryClient` - API request utilities
- `@/hooks/use-toast` - Toast notifications

---

## Basic Usage

### 1. Fetching User Preferences

```tsx
import { useUserPreferences } from "@/hooks/use-user-preferences";

function MyComponent() {
  const { preferences, isLoading, isError, error } = useUserPreferences();

  if (isLoading) {
    return <div>Loading preferences...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  return (
    <div>
      <h2>Investment Goal: {preferences?.investmentGoal}</h2>
      <h3>Risk Tolerance: {preferences?.riskTolerance}</h3>
      <p>Onboarding: {preferences?.onboardingCompleted ? 'Completed' : 'Pending'}</p>
    </div>
  );
}
```

---

## Advanced Usage

### 2. Creating Preferences (First-Time Onboarding)

```tsx
function OnboardingPage() {
  const { createPreferences, hasExistingPreferences } = useUserPreferences();

  const handleComplete = () => {
    if (hasExistingPreferences) {
      console.log('Preferences already exist!');
      return;
    }

    createPreferences.mutate({
      investmentGoal: 'growth',
      riskTolerance: 'aggressive',
      investmentHorizon: 'long_term',
      maxLeverageRatio: '2.0',
      maxConcentrationPct: '30.0',
      sectorPreferences: {
        prefer: ['Technology', 'Healthcare'],
        avoid: ['Energy']
      },
      onboardingCompleted: true
    });
  };

  return (
    <div>
      <button
        onClick={handleComplete}
        disabled={createPreferences.isPending}
      >
        {createPreferences.isPending ? 'Saving...' : 'Complete Onboarding'}
      </button>

      {createPreferences.isError && (
        <p className="text-red-500">Error: {createPreferences.error?.message}</p>
      )}
    </div>
  );
}
```

---

### 3. Updating Preferences (Wizard Auto-Save)

```tsx
function SettingsWizard() {
  const { preferences, updatePreferences } = useUserPreferences();

  const handleStepComplete = (stepData: Partial<UpdatePreferencesPayload>) => {
    // Optimistic update - UI updates immediately, rolls back on error
    updatePreferences.mutate(stepData);
  };

  const handleInvestmentGoalChange = (goal: string) => {
    handleStepComplete({
      investmentGoal: goal as 'growth' | 'income' | 'capital_preservation' | 'balanced'
    });
  };

  return (
    <div>
      <h2>Step 1: Investment Goal</h2>
      <select
        value={preferences?.investmentGoal}
        onChange={(e) => handleInvestmentGoalChange(e.target.value)}
        disabled={updatePreferences.isPending}
      >
        <option value="growth">Growth</option>
        <option value="income">Income</option>
        <option value="capital_preservation">Capital Preservation</option>
        <option value="balanced">Balanced</option>
      </select>

      {updatePreferences.isPending && <span>Saving...</span>}
    </div>
  );
}
```

---

### 4. Conditional Rendering Based on Onboarding Status

```tsx
function DashboardPage() {
  const { hasCompletedOnboarding, isLoading } = useUserPreferences();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" />;
  }

  return <Dashboard />;
}
```

---

### 5. Manual Data Refresh

```tsx
function PreferencesPage() {
  const { preferences, refreshPreferences, isFetching } = useUserPreferences();

  return (
    <div>
      <h2>Your Preferences</h2>
      <pre>{JSON.stringify(preferences, null, 2)}</pre>

      <button onClick={refreshPreferences} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh Data'}
      </button>
    </div>
  );
}
```

---

## API Reference

### Return Values

| Field | Type | Description |
|-------|------|-------------|
| `preferences` | `UserPreferences \| undefined` | User preferences data (or defaults for new users) |
| `isLoading` | `boolean` | Initial loading state |
| `isFetching` | `boolean` | Background refetch state |
| `isError` | `boolean` | Error state |
| `isSuccess` | `boolean` | Success state |
| `error` | `Error \| null` | Error object if query failed |
| `createPreferences` | `MutationObject` | Mutation for POST /api/user/preferences |
| `updatePreferences` | `MutationObject` | Mutation for PUT /api/user/preferences |
| `refreshPreferences` | `() => Promise<void>` | Manual refresh function |
| `hasCompletedOnboarding` | `boolean` | Helper: `onboardingCompleted` flag |
| `hasExistingPreferences` | `boolean` | Helper: `exists` flag from API |

---

### UserPreferences Interface

```typescript
export interface UserPreferences {
  userId: string;
  investmentGoal: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short_term' | 'medium_term' | 'long_term';
  maxLeverageRatio: string;
  maxConcentrationPct: string;
  maxSectorConcentrationPct: string;
  minCashRatio: string;
  maxMarginUsagePct: string;
  targetBeta: string | null;
  targetDelta: string | null;
  sectorPreferences: {
    prefer: string[];
    avoid: string[];
  };
  onboardingCompleted: boolean;
  exists: boolean; // true if DB record exists, false if defaults
  createdAt?: string;
  updatedAt?: string;
}
```

---

### CreatePreferencesPayload Interface

```typescript
export interface CreatePreferencesPayload {
  // Required fields
  investmentGoal: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short_term' | 'medium_term' | 'long_term';

  // Optional fields (use API defaults if not provided)
  maxLeverageRatio?: string;
  maxConcentrationPct?: string;
  maxSectorConcentrationPct?: string;
  minCashRatio?: string;
  maxMarginUsagePct?: string;
  targetBeta?: string | null;
  targetDelta?: string | null;
  sectorPreferences?: {
    prefer: string[];
    avoid: string[];
  };
  onboardingCompleted?: boolean;
}
```

---

### UpdatePreferencesPayload Interface

```typescript
export interface UpdatePreferencesPayload {
  // All fields optional for partial updates
  investmentGoal?: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  riskTolerance?: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon?: 'short_term' | 'medium_term' | 'long_term';
  maxLeverageRatio?: string;
  maxConcentrationPct?: string;
  maxSectorConcentrationPct?: string;
  minCashRatio?: string;
  maxMarginUsagePct?: string;
  targetBeta?: string | null;
  targetDelta?: string | null;
  sectorPreferences?: {
    prefer: string[];
    avoid: string[];
  };
  onboardingCompleted?: boolean;
}
```

---

## Mutation Objects

Both `createPreferences` and `updatePreferences` return TanStack Query mutation objects:

```typescript
{
  mutate: (payload) => void;
  mutateAsync: (payload) => Promise<UserPreferences>;
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
  error: Error | null;
  data: UserPreferences | undefined;
  reset: () => void;
}
```

---

## Key Features

### 1. Optimistic Updates

The `updatePreferences` mutation uses optimistic updates for instant UI feedback:

```typescript
// UI updates immediately based on user input
updatePreferences.mutate({ investmentGoal: 'growth' });

// If server request fails, UI automatically rolls back to previous state
```

**How it works**:
1. **onMutate**: Cancel ongoing queries, snapshot current data, update cache optimistically
2. **onSuccess**: Replace optimistic data with server response
3. **onError**: Rollback to previous data
4. **onSettled**: Invalidate cache to ensure sync with server

---

### 2. Automatic Cache Management

- **staleTime**: 5 minutes (preferences don't change frequently)
- **Cache invalidation**: Automatic after mutations
- **Manual refresh**: `refreshPreferences()` function

---

### 3. Error Handling

All errors are handled with toast notifications:

```typescript
// 409 Conflict - Preferences already exist
createPreferences.mutate(data); // Shows: "偏好设置已存在"

// Generic errors
updatePreferences.mutate(data); // Shows: "更新失败"
```

Custom error handling:

```typescript
createPreferences.mutate(data, {
  onError: (error) => {
    console.error('Custom error handler:', error);
    // Your custom logic here
  }
});
```

---

### 4. Default Preferences for New Users

If a user hasn't completed onboarding, the API returns sensible defaults:

```json
{
  "userId": "user-123",
  "investmentGoal": "balanced",
  "riskTolerance": "moderate",
  "investmentHorizon": "medium_term",
  "maxLeverageRatio": "1.5",
  "maxConcentrationPct": "25.0",
  "maxSectorConcentrationPct": "40.0",
  "minCashRatio": "10.0",
  "maxMarginUsagePct": "50.0",
  "targetBeta": null,
  "targetDelta": null,
  "sectorPreferences": { "prefer": [], "avoid": [] },
  "onboardingCompleted": false,
  "exists": false
}
```

---

## Integration with Settings Wizard

The hook is designed to work seamlessly with a multi-step wizard:

```tsx
function SettingsWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const { preferences, updatePreferences, createPreferences } = useUserPreferences();

  const handleStepComplete = (stepData: Partial<UpdatePreferencesPayload>) => {
    if (preferences?.exists) {
      // Update existing preferences
      updatePreferences.mutate(stepData, {
        onSuccess: () => setCurrentStep(currentStep + 1)
      });
    } else {
      // For new users, collect all data first, then create
      // Or use updatePreferences which has upsert behavior
      updatePreferences.mutate(stepData, {
        onSuccess: () => setCurrentStep(currentStep + 1)
      });
    }
  };

  return (
    <div>
      {currentStep === 1 && <Step1InvestmentGoal onComplete={handleStepComplete} />}
      {currentStep === 2 && <Step2RiskTolerance onComplete={handleStepComplete} />}
      {currentStep === 3 && <Step3InvestmentHorizon onComplete={handleStepComplete} />}
      {/* ... more steps ... */}
    </div>
  );
}
```

---

## Testing Examples

### Unit Testing with React Testing Library

```tsx
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUserPreferences } from './use-user-preferences';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

test('should fetch default preferences for new user', async () => {
  const { result } = renderHook(() => useUserPreferences(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  expect(result.current.preferences?.exists).toBe(false);
  expect(result.current.preferences?.investmentGoal).toBe('balanced');
});

test('should create new preferences', async () => {
  const { result } = renderHook(() => useUserPreferences(), {
    wrapper: createWrapper(),
  });

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false);
  });

  act(() => {
    result.current.createPreferences.mutate({
      investmentGoal: 'growth',
      riskTolerance: 'aggressive',
      investmentHorizon: 'long_term',
    });
  });

  await waitFor(() => {
    expect(result.current.createPreferences.isSuccess).toBe(true);
  });
});
```

---

## Common Patterns

### 1. Form Integration with React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { useUserPreferences } from '@/hooks/use-user-preferences';

function PreferencesForm() {
  const { preferences, updatePreferences } = useUserPreferences();
  const { register, handleSubmit } = useForm({
    defaultValues: preferences,
  });

  const onSubmit = (data: UpdatePreferencesPayload) => {
    updatePreferences.mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <select {...register('investmentGoal')}>
        <option value="growth">Growth</option>
        <option value="income">Income</option>
        <option value="capital_preservation">Capital Preservation</option>
        <option value="balanced">Balanced</option>
      </select>

      <button type="submit" disabled={updatePreferences.isPending}>
        Save Preferences
      </button>
    </form>
  );
}
```

---

### 2. Step-by-Step Wizard with Auto-Save

```tsx
function WizardStep({ field, value, onNext }: WizardStepProps) {
  const { updatePreferences } = useUserPreferences();

  const handleSelect = (newValue: string) => {
    updatePreferences.mutate(
      { [field]: newValue },
      {
        onSuccess: () => {
          setTimeout(onNext, 300); // Brief delay for user feedback
        },
      }
    );
  };

  return (
    <div>
      <h2>Select your {field}</h2>
      {/* Options... */}
      <button onClick={() => handleSelect(value)}>
        {updatePreferences.isPending ? 'Saving...' : 'Continue'}
      </button>
    </div>
  );
}
```

---

### 3. Conditional Routing Based on Onboarding

```tsx
import { Navigate } from 'wouter';
import { useUserPreferences } from '@/hooks/use-user-preferences';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { hasCompletedOnboarding, isLoading } = useUserPreferences();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!hasCompletedOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }

  return <>{children}</>;
}
```

---

## Performance Considerations

### Cache Configuration

```typescript
// Hook already configured with:
{
  staleTime: 1000 * 60 * 5,  // 5 minutes
  refetchOnWindowFocus: false,
  refetchInterval: false,
  retry: false
}
```

**Why these settings?**
- **staleTime: 5 min** - Preferences rarely change, so reduce unnecessary refetches
- **refetchOnWindowFocus: false** - Don't refetch when user switches tabs
- **retry: false** - Fail fast for better UX

### Optimistic Updates

Optimistic updates provide instant UI feedback without waiting for server response. This is critical for wizard flows where users expect immediate step progression.

**Trade-off**: Slightly more complex code, but significantly better UX.

---

## Error Scenarios

| Scenario | Behavior | User Feedback |
|----------|----------|---------------|
| Network failure | Rollback optimistic update | Toast: "更新失败" |
| 409 Conflict (POST) | Show error, suggest PUT | Toast: "偏好设置已存在" |
| 401 Unauthorized | apiRequest throws error | Error boundary or login redirect |
| 400 Validation Error | Show error | Toast: "更新失败" + error details |
| 500 Server Error | Show error | Toast: "无法更新偏好设置" |

---

## Next Steps

1. ✅ Hook implementation complete
2. ⏳ Create Settings Wizard UI components
3. ⏳ Integrate hook into wizard components
4. ⏳ Add E2E tests for wizard flow
5. ⏳ Deploy and test in staging environment

---

## Related Documentation

- **API Documentation**: `/docs/PHASE_2_PROGRESS_STEP2.md`
- **Database Schema**: `/docs/PHASE_2_PROGRESS_STEP1.md`
- **Verification Report**: `/docs/PHASE_2_VERIFICATION_REPORT.md`
- **Migration Guide**: `/docs/MIGRATION_GUIDE.md`

---

**Document Version**: 1.0
**Last Updated**: 2025-10-24
**Author**: Claude Code AI Assistant
