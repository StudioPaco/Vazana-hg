import { useEffect, useCallback } from 'react'

interface UseAutoRefreshOptions {
  intervalMinutes?: number
  onRefresh: () => Promise<void> | void
  enabled?: boolean
  refreshOnFocus?: boolean
  refreshOnLoad?: boolean
}

export function useAutoRefresh({
  intervalMinutes = 30,
  onRefresh,
  enabled = true,
  refreshOnFocus = true,
  refreshOnLoad = true,
}: UseAutoRefreshOptions) {
  const handleRefresh = useCallback(async () => {
    if (!enabled) return
    
    try {
      await onRefresh()
      console.log('[AutoRefresh] Job status refreshed successfully')
    } catch (error) {
      console.warn('[AutoRefresh] Failed to refresh job status:', error)
    }
  }, [onRefresh, enabled])

  // Set up interval refresh
  useEffect(() => {
    if (!enabled) return

    const intervalMs = intervalMinutes * 60 * 1000
    const interval = setInterval(handleRefresh, intervalMs)

    console.log(`[AutoRefresh] Started auto-refresh every ${intervalMinutes} minutes`)

    return () => {
      clearInterval(interval)
      console.log('[AutoRefresh] Stopped auto-refresh')
    }
  }, [handleRefresh, intervalMinutes, enabled])

  // Refresh on page load
  useEffect(() => {
    if (!enabled || !refreshOnLoad) return
    
    console.log('[AutoRefresh] Initial refresh on page load')
    handleRefresh()
  }, [handleRefresh, enabled, refreshOnLoad])

  // Refresh when page regains focus
  useEffect(() => {
    if (!enabled || !refreshOnFocus) return

    const handleFocus = () => {
      console.log('[AutoRefresh] Page focused - refreshing job status')
      handleRefresh()
    }

    window.addEventListener('focus', handleFocus)
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        handleFocus()
      }
    })

    return () => {
      window.removeEventListener('focus', handleFocus)
      document.removeEventListener('visibilitychange', handleFocus)
    }
  }, [handleRefresh, enabled, refreshOnFocus])

  return { manualRefresh: handleRefresh }
}