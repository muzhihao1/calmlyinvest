import { supabase } from './supabase';

// Special handling for your account
const SPECIAL_ACCOUNTS = {
  '279838958@qq.com': {
    numericId: 2,
    uuid: '8e82d664-5ef9-47c1-a540-9af664860a7c',
    password: 'muzhihao12'
  }
};

export async function hybridSignIn(email: string, password: string) {
  // First, check if it's a special account
  const specialAccount = SPECIAL_ACCOUNTS[email];
  if (specialAccount && password === specialAccount.password) {
    // For special accounts, try Supabase first, but fallback to legacy
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (!error && data.user) {
        // Store both IDs for compatibility
        localStorage.setItem('userId', specialAccount.uuid);
        localStorage.setItem('numericUserId', specialAccount.numericId.toString());
        return { user: data.user, session: data.session, isLegacy: false };
      }
    } catch (e) {
      console.log('Supabase auth failed, using legacy auth');
    }
    
    // Fallback to legacy auth
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('userId', specialAccount.uuid);
      localStorage.setItem('numericUserId', specialAccount.numericId.toString());
      
      // Create a mock user object for compatibility
      return {
        user: {
          id: specialAccount.uuid,
          email: email,
          // Add other required fields with defaults
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString()
        } as any,
        session: null,
        isLegacy: true
      };
    }
    
    throw new Error('Authentication failed');
  }
  
  // For other accounts, use Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  
  return { user: data.user, session: data.session, isLegacy: false };
}

export function getCurrentUserId(): string {
  // First check for Supabase user
  const user = supabase.auth.getUser();
  if (user) {
    return user.id;
  }
  
  // Then check local storage
  const storedUserId = localStorage.getItem('userId');
  if (storedUserId) {
    return storedUserId;
  }
  
  // Default to guest
  return 'guest';
}