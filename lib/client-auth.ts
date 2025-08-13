"use client"

export interface User {
  username: string
  role: "admin" | "user"
}

export const clientAuth = {
  login: (username: string, password: string): User | null => {
    if (username === "root" && password === "10203040") {
      const user: User = { username: "root", role: "admin" }
      localStorage.setItem("vazana_user", JSON.stringify(user))
      return user
    }
    return null
  },

  logout: () => {
    localStorage.removeItem("vazana_user")
  },

  getCurrentUser: (): User | null => {
    if (typeof window === "undefined") return null
    const userStr = localStorage.getItem("vazana_user")
    return userStr ? JSON.parse(userStr) : null
  },

  isAuthenticated: (): boolean => {
    return clientAuth.getCurrentUser() !== null
  },
}
