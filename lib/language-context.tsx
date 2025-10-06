"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type Language = "he" | "en"
export type Direction = "rtl" | "ltr"

type LanguageContextType = {
  language: Language
  direction: Direction
  isRTL: boolean
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("he") // Default to Hebrew
  
  const direction: Direction = language === "he" ? "rtl" : "ltr"
  const isRTL = direction === "rtl"

  useEffect(() => {
    // Load language from localStorage
    const savedLanguage = localStorage.getItem("vazana_language") as Language
    if (savedLanguage && ["he", "en"].includes(savedLanguage)) {
      setLanguageState(savedLanguage)
    }
  }, [])

  useEffect(() => {
    // Apply direction to document
    const root = document.documentElement
    root.setAttribute("dir", direction)
    root.setAttribute("lang", language)
    
    // Update body classes for styling
    if (isRTL) {
      document.body.classList.add("rtl")
      document.body.classList.remove("ltr")
    } else {
      document.body.classList.add("ltr")
      document.body.classList.remove("rtl")
    }
  }, [language, direction, isRTL])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("vazana_language", lang)
  }

  const toggleLanguage = () => {
    const newLanguage = language === "he" ? "en" : "he"
    setLanguage(newLanguage)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        direction,
        isRTL,
        setLanguage,
        toggleLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}