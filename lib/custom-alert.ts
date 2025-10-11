// Custom alert functions to replace browser defaults with proper app branding

// Get current language preference
function getCurrentLanguage(): string {
  if (typeof window === 'undefined') return 'he'
  return localStorage.getItem('vazana-language') || 'he'
}

// Get app title based on language
function getAppTitle(): string {
  const lang = getCurrentLanguage()
  return lang === 'he' ? 'וזאנה - אבטחת כבישים' : 'Vazana - Roadside Security'
}

// Custom alert with proper title
export function customAlert(message: string): void {
  if (typeof window === 'undefined') {
    console.log(message)
    return
  }
  
  // Try to use a more modern approach first
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(getAppTitle(), {
      body: message,
      icon: '/favicon.ico'
    })
  } else {
    // Fallback to alert but with better formatting
    const title = getAppTitle()
    alert(`${title}\n\n${message}`)
  }
}

// Custom confirm with proper title
export function customConfirm(message: string): boolean {
  if (typeof window === 'undefined') {
    console.log(message)
    return false
  }
  
  const title = getAppTitle()
  return confirm(`${title}\n\n${message}`)
}

// Request notification permission on first use
export function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission()
  }
}