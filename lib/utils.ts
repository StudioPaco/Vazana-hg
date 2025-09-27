export function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(" ").trim()
}

export type ClassValue = string | undefined | null | boolean
