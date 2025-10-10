import { useState, useEffect } from 'react';

interface UserPreferences {
  show_deleted_jobs: boolean;
  show_finished_jobs: boolean;
  add_to_calendar_default: boolean;
  jobs_view_mode: 'list' | 'grid';
  default_status_filter: string;
  default_client_filter: string;
}

interface UseUserPreferencesReturn {
  preferences: UserPreferences | null;
  loading: boolean;
  error: string | null;
  updatePreference: (key: keyof UserPreferences, value: any) => Promise<void>;
  updatePreferences: (updates: Partial<UserPreferences>) => Promise<void>;
  refetch: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  show_deleted_jobs: false,
  show_finished_jobs: true, // Default to true
  add_to_calendar_default: false,
  jobs_view_mode: 'list',
  default_status_filter: 'all',
  default_client_filter: 'all'
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getStorageKey = () => {
    // Use current user for storage key
    if (typeof window === 'undefined') return 'vazana_preferences_default';
    
    try {
      const currentUser = localStorage.getItem('vazana_user');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        return `vazana_preferences_${user.id || user.username || 'default'}`;
      }
    } catch (error) {
      console.warn('Failed to parse user data for preferences key:', error);
    }
    
    return 'vazana_preferences_default';
  };

  const loadFromStorage = (): UserPreferences => {
    if (typeof window === 'undefined') return defaultPreferences;
    
    try {
      const key = getStorageKey();
      const stored = localStorage.getItem(key);
      console.log('[Preferences] Loading from storage with key:', key, 'stored:', stored);
      
      if (stored) {
        const parsed = JSON.parse(stored);
        const merged = { ...defaultPreferences, ...parsed };
        console.log('[Preferences] Loaded and merged:', merged);
        return merged;
      }
    } catch (error) {
      console.warn('Failed to load preferences from storage:', error);
    }
    
    console.log('[Preferences] Using default preferences:', defaultPreferences);
    return defaultPreferences;
  };

  const saveToStorage = (prefs: UserPreferences) => {
    if (typeof window === 'undefined') return;
    
    try {
      const key = getStorageKey();
      console.log('[Preferences] Saving to storage with key:', key, 'prefs:', prefs);
      localStorage.setItem(key, JSON.stringify(prefs));
    } catch (error) {
      console.warn('Failed to save preferences to storage:', error);
    }
  };

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load from localStorage first for immediate response
      const storedPrefs = loadFromStorage();
      console.log('[Preferences] fetchPreferences - loaded from storage:', storedPrefs);
      setPreferences(storedPrefs);
      
      // Then try to sync with server
      const response = await fetch('/api/user-preferences');
      
      if (!response.ok) {
        console.warn('API preferences failed, using stored preferences');
        return;
      }
      
      const data = await response.json();
      
      if (data.error) {
        console.warn('API preferences error, using stored preferences:', data.error);
        return;
      }
      
      // Don't override localStorage with API defaults - trust localStorage more
      const mergedPrefs = { ...defaultPreferences, ...data, ...storedPrefs };
      console.log('[Preferences] merged preferences (localStorage takes precedence):', mergedPrefs);
      setPreferences(mergedPrefs);
      saveToStorage(mergedPrefs);
      
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
      
      // Fallback to stored or default preferences
      const fallbackPrefs = loadFromStorage();
      console.log('[Preferences] using fallback:', fallbackPrefs);
      setPreferences(fallbackPrefs);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      setError(null);
      console.log('[Preferences] updatePreferences called with:', updates);
      console.log('[Preferences] current preferences before update:', preferences);
      
      // Update local state and storage immediately for responsiveness
      const newPrefs = preferences ? { ...preferences, ...updates } : { ...defaultPreferences, ...updates };
      console.log('[Preferences] new preferences calculated:', newPrefs);
      
      setPreferences(newPrefs);
      saveToStorage(newPrefs);
      
      // Try to sync with server in background
      try {
        const response = await fetch('/api/user-preferences', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
        
        if (!response.ok) {
          console.warn('Failed to sync preferences with server:', response.status);
        }
        
        const data = await response.json();
        
        if (data.error) {
          console.warn('Server preferences error:', data.error);
        }
      } catch (syncError) {
        console.warn('Failed to sync preferences with server:', syncError);
        // Don't throw - local storage update succeeded
      }
      
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err;
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    await updatePreferences({ [key]: value });
  };

  const refetch = async () => {
    await fetchPreferences();
  };

  useEffect(() => {
    console.log('[Preferences] useEffect triggered - fetching preferences');
    fetchPreferences();
  }, []);
  
  // Debug effect to log when preferences change
  useEffect(() => {
    console.log('[Preferences] preferences state changed:', preferences);
  }, [preferences]);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updatePreferences,
    refetch
  };
}