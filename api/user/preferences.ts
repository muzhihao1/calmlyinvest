/**
 * User Preferences API Endpoint
 * Handles GET, POST, and PUT operations for user investment preferences
 * Phase 2 - User Preferences System
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { requireAuth } from '../utils/auth';
import { sendSuccess, sendError, setCorsHeaders, handleValidationError } from '../utils/response';
import { insertUserPreferencesSchema, updateUserPreferencesSchema } from '../../shared/schema-supabase';
import { z } from 'zod';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

/**
 * Default user preferences based on industry best practices
 * Used when user has not completed onboarding
 */
const DEFAULT_PREFERENCES = {
  investmentGoal: 'balanced',
  riskTolerance: 'moderate',
  investmentHorizon: 'medium_term',
  maxLeverageRatio: '1.5',
  maxConcentrationPct: '25.0',
  maxSectorConcentrationPct: '40.0',
  minCashRatio: '10.0',
  maxMarginUsagePct: '50.0',
  targetBeta: null,
  targetDelta: null,
  sectorPreferences: { prefer: [], avoid: [] },
  onboardingCompleted: false,
};

/**
 * Extract JWT token from Authorization header
 */
function extractToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Main request handler
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS headers
  setCorsHeaders(res, req);

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify authentication
  const authResult = await requireAuth(req);
  if ('error' in authResult) {
    return sendError(res, authResult.error, authResult.status);
  }

  const user = authResult;
  const userId = user.id;

  // Extract token for creating authenticated Supabase client
  const token = extractToken(req.headers.authorization);
  if (!token) {
    return sendError(res, 'Missing authentication token', 401);
  }

  // Create Supabase client with user's token (RLS will apply automatically)
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  });

  try {
    switch (req.method) {
      case 'GET':
        return await handleGet(res, userId, supabase);
      case 'POST':
        return await handlePost(req, res, userId, supabase);
      case 'PUT':
        return await handlePut(req, res, userId, supabase);
      default:
        return sendError(res, 'Method not allowed', 405);
    }
  } catch (error) {
    console.error('API Error:', error);
    return sendError(res, error instanceof Error ? error : 'Internal server error', 500);
  }
}

/**
 * GET /api/user/preferences
 * Retrieve user preferences for the authenticated user
 * Returns default preferences if user hasn't completed onboarding
 */
async function handleGet(res: VercelResponse, userId: string, supabase: any) {
  try {
    // Query user_preferences table (RLS will ensure user can only access their own data)
    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no preferences found, return defaults with 200 status
      // This is expected for new users who haven't completed onboarding
      if (error.code === 'PGRST116') {
        console.log(`No preferences found for user ${userId}, returning defaults`);
        return sendSuccess(res, {
          ...DEFAULT_PREFERENCES,
          userId,
          exists: false,
        });
      }

      console.error('Supabase query error:', error);
      return sendError(res, 'Failed to fetch user preferences', 500, error);
    }

    // Return existing preferences
    return sendSuccess(res, {
      ...data,
      exists: true,
    });
  } catch (error) {
    console.error('GET handler error:', error);
    throw error;
  }
}

/**
 * POST /api/user/preferences
 * Create new user preferences (first-time setup)
 * Returns 409 if preferences already exist
 */
async function handlePost(req: VercelRequest, res: VercelResponse, userId: string, supabase: any) {
  try {
    // Validate request body
    const validationResult = insertUserPreferencesSchema.safeParse({
      ...req.body,
      userId, // Ensure userId from auth token is used
    });

    if (!validationResult.success) {
      return handleValidationError(res, validationResult.error);
    }

    const preferences = validationResult.data;

    // Check if preferences already exist (RLS ensures we only see user's own data)
    const { data: existing } = await supabase
      .from('user_preferences')
      .select('user_id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      return sendError(
        res,
        'User preferences already exist. Use PUT to update.',
        409,
        { userId }
      );
    }

    // Insert new preferences (RLS ensures we can only insert for our own user_id)
    const { data, error } = await supabase
      .from('user_preferences')
      .insert({
        user_id: userId,
        investment_goal: preferences.investmentGoal,
        risk_tolerance: preferences.riskTolerance,
        investment_horizon: preferences.investmentHorizon,
        max_leverage_ratio: preferences.maxLeverageRatio || DEFAULT_PREFERENCES.maxLeverageRatio,
        max_concentration_pct: preferences.maxConcentrationPct || DEFAULT_PREFERENCES.maxConcentrationPct,
        max_sector_concentration_pct: preferences.maxSectorConcentrationPct || DEFAULT_PREFERENCES.maxSectorConcentrationPct,
        min_cash_ratio: preferences.minCashRatio || DEFAULT_PREFERENCES.minCashRatio,
        max_margin_usage_pct: preferences.maxMarginUsagePct || DEFAULT_PREFERENCES.maxMarginUsagePct,
        target_beta: preferences.targetBeta || null,
        target_delta: preferences.targetDelta || null,
        sector_preferences: preferences.sectorPreferences || DEFAULT_PREFERENCES.sectorPreferences,
        onboarding_completed: preferences.onboardingCompleted || false,
      })
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return sendError(res, 'Failed to create user preferences', 500, error);
    }

    console.log(`Created preferences for user ${userId}`);
    return sendSuccess(res, data, 201);
  } catch (error) {
    console.error('POST handler error:', error);
    throw error;
  }
}

/**
 * PUT /api/user/preferences
 * Update existing user preferences (wizard auto-save)
 * Creates new preferences if they don't exist (upsert behavior)
 */
async function handlePut(req: VercelRequest, res: VercelResponse, userId: string, supabase: any) {
  try {
    // Validate request body (all fields optional for updates)
    const validationResult = updateUserPreferencesSchema.safeParse(req.body);

    if (!validationResult.success) {
      return handleValidationError(res, validationResult.error);
    }

    const updates = validationResult.data;

    // Build update object with only provided fields
    const updateData: any = {};

    if (updates.investmentGoal !== undefined) {
      updateData.investment_goal = updates.investmentGoal;
    }
    if (updates.riskTolerance !== undefined) {
      updateData.risk_tolerance = updates.riskTolerance;
    }
    if (updates.investmentHorizon !== undefined) {
      updateData.investment_horizon = updates.investmentHorizon;
    }
    if (updates.maxLeverageRatio !== undefined) {
      updateData.max_leverage_ratio = updates.maxLeverageRatio;
    }
    if (updates.maxConcentrationPct !== undefined) {
      updateData.max_concentration_pct = updates.maxConcentrationPct;
    }
    if (updates.maxSectorConcentrationPct !== undefined) {
      updateData.max_sector_concentration_pct = updates.maxSectorConcentrationPct;
    }
    if (updates.minCashRatio !== undefined) {
      updateData.min_cash_ratio = updates.minCashRatio;
    }
    if (updates.maxMarginUsagePct !== undefined) {
      updateData.max_margin_usage_pct = updates.maxMarginUsagePct;
    }
    if (updates.targetBeta !== undefined) {
      updateData.target_beta = updates.targetBeta;
    }
    if (updates.targetDelta !== undefined) {
      updateData.target_delta = updates.targetDelta;
    }
    if (updates.sectorPreferences !== undefined) {
      updateData.sector_preferences = updates.sectorPreferences;
    }
    if (updates.onboardingCompleted !== undefined) {
      updateData.onboarding_completed = updates.onboardingCompleted;
    }

    // Update timestamp
    updateData.updated_at = new Date().toISOString();

    // Perform upsert (update if exists, insert if not)
    // RLS ensures we can only upsert our own user_id
    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          user_id: userId,
          ...updateData,
        },
        {
          onConflict: 'user_id',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return sendError(res, 'Failed to update user preferences', 500, error);
    }

    console.log(`Updated preferences for user ${userId}`);
    return sendSuccess(res, data);
  } catch (error) {
    console.error('PUT handler error:', error);
    throw error;
  }
}
