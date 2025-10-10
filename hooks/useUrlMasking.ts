"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'

interface UrlMaskingOptions {
  maskChildRoutes?: boolean
  maskedUrl?: string
}

export function useUrlMasking(options: UrlMaskingOptions = {}) {
  const pathname = usePathname()
  const { maskChildRoutes = true, maskedUrl = '/' } = options
  
  useEffect(() => {
    if (typeof window === 'undefined') {
      return
    }
    
    // Always mask any non-root route (except auth and settings)
    const isAuthRoute = pathname.startsWith('/auth')
    const isSettingsRoute = pathname.startsWith('/settings')
    const isRootRoute = pathname === '/'
    const shouldMask = maskChildRoutes && !isAuthRoute && !isSettingsRoute && !isRootRoute
    
    if (shouldMask) {
      // Replace the URL in the browser without triggering navigation
      const baseUrl = window.location.protocol + '//' + window.location.host
      const newUrl = baseUrl + maskedUrl
      
      // Only update if the current URL is different
      if (window.location.href !== newUrl) {
        try {
          // Use replaceState to change URL without navigation or page reload
          window.history.replaceState(
            { ...window.history.state, originalPath: pathname }, 
            '', 
            newUrl
          )
          
          // Also update the document title to be consistent
          document.title = 'Vazana'
        } catch (error) {
          console.warn('URL masking failed:', error)
        }
      }
    }
    
    // Additional safeguard - periodically check and enforce masking
    const interval = setInterval(() => {
      // Re-check current path to avoid masking settings pages that might change
      const currentPath = window.location.pathname
      const isCurrentSettingsRoute = currentPath.startsWith('/settings')
      const isCurrentAuthRoute = currentPath.startsWith('/auth')
      const shouldCurrentlyMask = maskChildRoutes && !isCurrentAuthRoute && !isCurrentSettingsRoute && currentPath !== '/'
      
      if (shouldCurrentlyMask && currentPath !== maskedUrl) {
        const baseUrl = window.location.protocol + '//' + window.location.host
        const newUrl = baseUrl + maskedUrl
        try {
          window.history.replaceState(
            { ...window.history.state, originalPath: pathname }, 
            '', 
            newUrl
          )
          document.title = 'Vazana'
        } catch (error) {
          console.warn('Periodic URL masking failed:', error)
        }
      }
    }, 1000) // Check every second
    
    return () => clearInterval(interval)
  }, [pathname, maskChildRoutes, maskedUrl])
  
  // Function to restore the real URL when needed
  const unmaskUrl = () => {
    if (typeof window === 'undefined') return
    
    const state = window.history.state
    if (state && state.maskedUrl) {
      const baseUrl = window.location.protocol + '//' + window.location.host
      const realUrl = baseUrl + state.maskedUrl
      
      try {
        window.history.replaceState(
          { ...state, maskedUrl: undefined },
          '',
          realUrl
        )
      } catch (error) {
        console.warn('URL unmasking failed:', error)
      }
    }
  }
  
  return { unmaskUrl }
}