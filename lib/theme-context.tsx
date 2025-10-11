"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

type ColorTheme = {
  name: string
  primary: string
  secondary: string
  accent: string
  background: string
  foreground: string
}

const colorThemes: ColorTheme[] = [
  {
    name: "וזאנה קלאסי",
    primary: "#F59E0B", // vazana-yellow
    secondary: "#06B6D4", // vazana-teal
    accent: "#FFFFFF",
    background: "#F9FAFB",
    foreground: "#1F2937",
  },
  {
    name: "כחול מקצועי",
    primary: "#3B82F6",
    secondary: "#1E40AF",
    accent: "#DBEAFE",
    background: "#F8FAFC",
    foreground: "#0F172A",
  },
  {
    name: "ירוק טבעי",
    primary: "#10B981",
    secondary: "#059669",
    accent: "#D1FAE5",
    background: "#F0FDF4",
    foreground: "#064E3B",
  },
  {
    name: "סגול יצירתי",
    primary: "#8B5CF6",
    secondary: "#7C3AED",
    accent: "#EDE9FE",
    background: "#FAFAF9",
    foreground: "#581C87",
  },
  {
    name: "אדום אנרגטי",
    primary: "#EF4444",
    secondary: "#DC2626",
    accent: "#FEE2E2",
    background: "#FFFBFB",
    foreground: "#7F1D1D",
  },
]

type ThemeContextType = {
  isDark: boolean
  setIsDark: (dark: boolean) => void
  sidebarMinimizedByDefault: boolean
  setSidebarMinimizedByDefault: (minimized: boolean) => void
  roundedContainers: boolean
  setRoundedContainers: (rounded: boolean) => void
  colorTheme: ColorTheme
  setColorTheme: (theme: ColorTheme) => void
  colorThemes: ColorTheme[]
  pendingSettings: {
    isDark: boolean
    sidebarMinimizedByDefault: boolean
    roundedContainers: boolean
    colorTheme: ColorTheme
  }
  setPendingSettings: (settings: any) => void
  applySettings: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(false)
  const [sidebarMinimizedByDefault, setSidebarMinimizedByDefault] = useState(false)
  const [roundedContainers, setRoundedContainers] = useState(true)
  const [colorTheme, setColorTheme] = useState(colorThemes[0])

  const [pendingSettings, setPendingSettings] = useState({
    isDark: false,
    sidebarMinimizedByDefault: false,
    roundedContainers: true,
    colorTheme: colorThemes[0],
  })

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("vazana_theme_settings")
    if (savedSettings) {
      const settings = JSON.parse(savedSettings)
      setIsDark(settings.isDark || false)
      setSidebarMinimizedByDefault(settings.sidebarMinimizedByDefault || false)
      setRoundedContainers(settings.roundedContainers !== undefined ? settings.roundedContainers : true)
      setColorTheme(settings.colorTheme || colorThemes[0])
      setPendingSettings({
        isDark: settings.isDark || false,
        sidebarMinimizedByDefault: settings.sidebarMinimizedByDefault || false,
        roundedContainers: settings.roundedContainers !== undefined ? settings.roundedContainers : true,
        colorTheme: settings.colorTheme || colorThemes[0],
      })
    }
  }, [])

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    const body = document.body
    
    if (isDark) {
      root.classList.add("dark")
      body.classList.add("dark")
      // Force dark mode styling
      body.style.backgroundColor = "#0f172a"
      body.style.color = "#f1f5f9"
    } else {
      root.classList.remove("dark")
      body.classList.remove("dark")
      body.style.backgroundColor = ""
      body.style.color = ""
    }

    // Apply color theme
    root.style.setProperty("--color-primary", colorTheme.primary)
    root.style.setProperty("--color-secondary", colorTheme.secondary)
    root.style.setProperty("--color-accent", colorTheme.accent)
    root.style.setProperty("--color-background", colorTheme.background)
    root.style.setProperty("--color-foreground", colorTheme.foreground)

    // Apply rounded containers
    if (roundedContainers) {
      root.classList.add("rounded-theme")
    } else {
      root.classList.remove("rounded-theme")
    }
  }, [isDark, colorTheme, roundedContainers])

  const applySettings = () => {
    setIsDark(pendingSettings.isDark)
    setSidebarMinimizedByDefault(pendingSettings.sidebarMinimizedByDefault)
    setRoundedContainers(pendingSettings.roundedContainers)
    setColorTheme(pendingSettings.colorTheme)

    // Save to localStorage
    localStorage.setItem("vazana_theme_settings", JSON.stringify(pendingSettings))
  }

  return (
    <ThemeContext.Provider
      value={{
        isDark,
        setIsDark,
        sidebarMinimizedByDefault,
        setSidebarMinimizedByDefault,
        roundedContainers,
        setRoundedContainers,
        colorTheme,
        setColorTheme,
        colorThemes,
        pendingSettings,
        setPendingSettings,
        applySettings,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
