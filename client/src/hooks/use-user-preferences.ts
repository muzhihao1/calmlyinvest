/**
 * User Preferences Hook
 * Manages user investment preferences with TanStack Query
 * Phase 2 - User Preferences System
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

/**
 * User Preferences Interface
 * Matches the API response from /api/user/preferences
 */
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

/**
 * Create Preferences Payload
 * Required fields for POST /api/user/preferences
 */
export interface CreatePreferencesPayload {
  investmentGoal: 'growth' | 'income' | 'capital_preservation' | 'balanced';
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  investmentHorizon: 'short_term' | 'medium_term' | 'long_term';
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

/**
 * Update Preferences Payload
 * All fields optional for PUT /api/user/preferences
 */
export interface UpdatePreferencesPayload {
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

/**
 * useUserPreferences Hook
 *
 * Manages user investment preferences with automatic caching and synchronization.
 *
 * @example
 * ```tsx
 * function SettingsPage() {
 *   const {
 *     preferences,
 *     isLoading,
 *     createPreferences,
 *     updatePreferences
 *   } = useUserPreferences();
 *
 *   const handleSave = () => {
 *     if (preferences?.exists) {
 *       updatePreferences.mutate({ investmentGoal: 'growth' });
 *     } else {
 *       createPreferences.mutate({
 *         investmentGoal: 'growth',
 *         riskTolerance: 'moderate',
 *         investmentHorizon: 'long_term'
 *       });
 *     }
 *   };
 *
 *   return <div>...</div>;
 * }
 * ```
 */
export function useUserPreferences() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  /**
   * Query: Fetch user preferences
   * Returns defaults for new users who haven't completed onboarding
   */
  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
    staleTime: 1000 * 60 * 5, // 5 minutes (preferences don't change often)
  });

  /**
   * Mutation: Create new user preferences (POST)
   * Used for first-time onboarding
   * Returns 409 Conflict if preferences already exist
   */
  const createPreferences = useMutation({
    mutationFn: async (payload: CreatePreferencesPayload) => {
      const response = await apiRequest("POST", "/api/user/preferences", payload);
      return response.json() as Promise<UserPreferences>;
    },
    onSuccess: (data) => {
      // Update cache with new data
      queryClient.setQueryData(['/api/user/preferences'], data);

      toast({
        title: "偏好设置已保存",
        description: "您的投资偏好已成功创建",
      });
    },
    onError: (error: Error) => {
      // Check if error is 409 Conflict (preferences already exist)
      if (error.message.includes('409')) {
        toast({
          title: "偏好设置已存在",
          description: "您的偏好设置已经创建过了，请使用更新功能",
          variant: "destructive",
        });
      } else {
        toast({
          title: "保存失败",
          description: "无法创建偏好设置，请稍后重试",
          variant: "destructive",
        });
      }
    },
  });

  /**
   * Mutation: Update user preferences (PUT)
   * Uses upsert - creates if doesn't exist, updates if exists
   * Ideal for wizard auto-save functionality
   */
  const updatePreferences = useMutation({
    mutationFn: async (payload: UpdatePreferencesPayload) => {
      const response = await apiRequest("PUT", "/api/user/preferences", payload);
      return response.json() as Promise<UserPreferences>;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['/api/user/preferences'] });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<UserPreferences>(['/api/user/preferences']);

      // Optimistically update to the new value
      if (previousData) {
        queryClient.setQueryData<UserPreferences>(['/api/user/preferences'], {
          ...previousData,
          ...newData,
          // Merge sector preferences if provided
          sectorPreferences: newData.sectorPreferences
            ? { ...previousData.sectorPreferences, ...newData.sectorPreferences }
            : previousData.sectorPreferences,
        });
      }

      // Return context with previous data
      return { previousData };
    },
    onSuccess: (data) => {
      // Replace optimistic data with server data
      queryClient.setQueryData(['/api/user/preferences'], data);

      toast({
        title: "偏好设置已更新",
        description: "您的投资偏好已成功更新",
      });
    },
    onError: (error, _newData, context) => {
      // Rollback to previous data on error
      if (context?.previousData) {
        queryClient.setQueryData(['/api/user/preferences'], context.previousData);
      }

      toast({
        title: "更新失败",
        description: "无法更新偏好设置，请稍后重试",
        variant: "destructive",
      });
    },
    onSettled: () => {
      // Always refetch after error or success to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
    },
  });

  /**
   * Helper: Refresh preferences from server
   * Useful for manual sync after external changes
   */
  const refreshPreferences = async () => {
    try {
      await queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });

      toast({
        title: "数据已更新",
        description: "偏好设置已重新加载",
      });
    } catch (error) {
      toast({
        title: "更新失败",
        description: "无法刷新数据，请稍后重试",
        variant: "destructive",
      });
    }
  };

  return {
    // Data
    preferences: preferencesQuery.data,

    // Loading states
    isLoading: preferencesQuery.isLoading,
    isFetching: preferencesQuery.isFetching,
    isError: preferencesQuery.isError,
    error: preferencesQuery.error,

    // Query state helpers
    isSuccess: preferencesQuery.isSuccess,

    // Mutations
    createPreferences,
    updatePreferences,

    // Actions
    refreshPreferences,

    // Helpers
    hasCompletedOnboarding: preferencesQuery.data?.onboardingCompleted ?? false,
    hasExistingPreferences: preferencesQuery.data?.exists ?? false,
  };
}

/**
 * Hook options interface for future extensibility
 * Currently not used, but provides structure for optional parameters
 */
export interface UseUserPreferencesOptions {
  enabled?: boolean;
  onSuccess?: (data: UserPreferences) => void;
  onError?: (error: Error) => void;
}

/**
 * Extended hook with options support (future enhancement)
 *
 * @example
 * ```tsx
 * const { preferences } = useUserPreferences({
 *   enabled: isAuthenticated,
 *   onSuccess: (data) => console.log('Loaded:', data)
 * });
 * ```
 */
export function useUserPreferencesWithOptions(options?: UseUserPreferencesOptions) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const preferencesQuery = useQuery<UserPreferences>({
    queryKey: ['/api/user/preferences'],
    staleTime: 1000 * 60 * 5,
    enabled: options?.enabled,
  });

  // Rest of implementation same as useUserPreferences
  // This is a placeholder for future enhancement

  return {
    preferences: preferencesQuery.data,
    isLoading: preferencesQuery.isLoading,
    // ... other fields
  };
}
