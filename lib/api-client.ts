import type { Client, Job, Worker, Vehicle, Cart } from "@/lib/types"

// Custom SDK to replace Base44 SDK calls
class ApiClient {
  private async request<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `/api${endpoint}`

    const authToken = typeof window !== "undefined" ? localStorage.getItem("vazana_auth_token") : null

    const response = await fetch(url, {
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken && { Authorization: `Bearer ${authToken}` }),
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "API request failed")
    }

    return response.json()
  }

  // Client methods
  async getClients(): Promise<{ data: Client[] }> {
    return this.request("/clients")
  }

  async getClient(id: string): Promise<{ data: Client }> {
    return this.request(`/clients/${id}`)
  }

  async createClient(data: Partial<Client>): Promise<{ data: Client }> {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: Partial<Client>): Promise<{ data: Client }> {
    return this.request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string): Promise<void> {
    return this.request(`/clients/${id}`, { method: "DELETE" })
  }

  // Job methods
  async getJobs(): Promise<{ data: Job[] }> {
    return this.request("/jobs")
  }

  async getJob(id: string): Promise<{ data: Job }> {
    return this.request(`/jobs/${id}`)
  }

  async createJob(data: Partial<Job>): Promise<{ data: Job }> {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateJob(id: string, data: Partial<Job>): Promise<{ data: Job }> {
    return this.request(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteJob(id: string): Promise<void> {
    return this.request(`/jobs/${id}`, { method: "DELETE" })
  }

  // Worker methods
  async getWorkers(): Promise<{ data: Worker[] }> {
    return this.request("/workers")
  }

  async createWorker(data: Partial<Worker>): Promise<{ data: Worker }> {
    return this.request("/workers", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Vehicle methods
  async getVehicles(): Promise<{ data: Vehicle[] }> {
    return this.request("/vehicles")
  }

  async createVehicle(data: Partial<Vehicle>): Promise<{ data: Vehicle }> {
    return this.request("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Cart methods
  async getCarts(): Promise<{ data: Cart[] }> {
    return this.request("/carts")
  }

  async createCart(data: Partial<Cart>): Promise<{ data: Cart }> {
    return this.request("/carts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
