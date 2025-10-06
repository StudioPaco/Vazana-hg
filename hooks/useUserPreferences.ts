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
  show_finished_jobs: false,
  add_to_calendar_default: false,
  jobs_view_mode: 'list',
  default_status_filter: 'all',
  default_client_filter: 'all'
};

export function useUserPreferences(): UseUserPreferencesReturn {
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPreferences = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/user-preferences');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      setPreferences({ ...defaultPreferences, ...data });
    } catch (err) {
      console.error('Error fetching user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch preferences');
      // Set default preferences on error
      setPreferences(defaultPreferences);
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (updates: Partial<UserPreferences>) => {
    try {
      setError(null);
      
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }
      
      // Update local state optimistically
      setPreferences(prev => prev ? { ...prev, ...updates } : { ...defaultPreferences, ...updates });
      
    } catch (err) {
      console.error('Error updating user preferences:', err);
      setError(err instanceof Error ? err.message : 'Failed to update preferences');
      throw err; // Re-throw so calling code can handle the error
    }
  };

  const updatePreference = async (key: keyof UserPreferences, value: any) => {
    await updatePreferences({ [key]: value });
  };

  const refetch = async () => {
    await fetchPreferences();
  };

  useEffect(() => {
    fetchPreferences();
  }, []);

  return {
    preferences,
    loading,
    error,
    updatePreference,
    updatePreferences,
    refetch
  };
}