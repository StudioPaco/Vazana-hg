// Entity classes for Vazana Studio business management system
import { createClient } from "@/lib/supabase/client"

const supabase = createClient()

// Base Entity class with common CRUD operations
class BaseEntity {
  static tableName = ""

  static async list() {
    const { data, error } = await supabase.from(this.tableName).select("*").order("created_at", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async get(id: string) {
    const { data, error } = await supabase.from(this.tableName).select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async create(data: any) {
    const { data: result, error } = await supabase.from(this.tableName).insert(data).select().single()

    if (error) throw error
    return result
  }

  static async update(id: string, data: any) {
    const { data: result, error } = await supabase.from(this.tableName).update(data).eq("id", id).select().single()

    if (error) throw error
    return result
  }

  static async delete(id: string) {
    const { error } = await supabase.from(this.tableName).delete().eq("id", id)

    if (error) throw error
    return true
  }
}

// Client entity
export class Client extends BaseEntity {
  static tableName = "clients"

  static async searchByName(query: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .ilike("company_name", `%${query}%`)
      .order("company_name")

    if (error) throw error
    return data || []
  }
}

// Job entity
export class Job extends BaseEntity {
  static tableName = "jobs"

  static async getByClient(clientId: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("client_id", clientId)
      .order("job_date", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getRecent(limit = 10) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}

// Worker entity
export class Worker extends BaseEntity {
  static tableName = "workers"

  static async getAvailable(date: string, shiftType: "day" | "night") {
    // This would need more complex logic to check availability JSON
    const { data, error } = await supabase.from(this.tableName).select("*").order("name")

    if (error) throw error
    return data || []
  }
}

// Vehicle entity
export class Vehicle extends BaseEntity {
  static tableName = "vehicles"
}

// Cart entity
export class Cart extends BaseEntity {
  static tableName = "carts"
}

// WorkType entity
export class WorkType extends BaseEntity {
  static tableName = "work_types"

  static async list() {
    try {
      const { data, error } = await supabase.from(this.tableName).select("*").order("created_at", { ascending: false })

      if (error) {
        console.error("Error listing work types:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error listing work types:", error)
      return []
    }
  }

  static async getByLanguage(language: "he" | "en") {
    try {
      const { data, error } = await supabase
        .from(this.tableName)
        .select("*")
        .order(language === "he" ? "name_he" : "name_en")

      if (error) {
        console.error("Error getting work types by language:", error)
        return []
      }
      return data || []
    } catch (error) {
      console.error("Error getting work types by language:", error)
      return []
    }
  }
}

// Receipt entity (for invoices)
export class Receipt extends BaseEntity {
  static tableName = "receipts"

  static async getByStatus(status: string) {
    const { data, error } = await supabase
      .from(this.tableName)
      .select("*")
      .eq("status", status)
      .order("receipt_date", { ascending: false })

    if (error) throw error
    return data || []
  }

  static async generateNumber() {
    // Generate next receipt number
    const { data, error } = await supabase
      .from(this.tableName)
      .select("receipt_number")
      .order("created_at", { ascending: false })
      .limit(1)

    if (error) throw error

    const lastNumber = data?.[0]?.receipt_number || "0000"
    const nextNumber = (Number.parseInt(lastNumber) + 1).toString().padStart(4, "0")
    return nextNumber
  }
}

// User entity
export class User extends BaseEntity {
  static tableName = "users"

  static async getByEmail(email: string) {
    const { data, error } = await supabase.from(this.tableName).select("*").eq("email", email).single()

    if (error) throw error
    return data
  }

  static async getAdmins() {
    const { data, error } = await supabase.from(this.tableName).select("*").eq("role", "admin").order("name")

    if (error) throw error
    return data || []
  }
}
