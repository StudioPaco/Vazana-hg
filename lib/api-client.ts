// Custom SDK to replace Base44 SDK calls
class ApiClient {
  private baseUrl: string

  constructor() {
    this.baseUrl = process.env.NODE_ENV === "production" ? "https://your-domain.com" : "http://localhost:3000"
  }

  private async request(endpoint: string, options: RequestInit = {}) {
    const url = `${this.baseUrl}/api${endpoint}`

    const authToken = typeof window !== "undefined" ? localStorage.getItem("vazana_auth_token") : null

    const response = await fetch(url, {
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
  async getClients() {
    return this.request("/clients")
  }

  async getClient(id: string) {
    return this.request(`/clients/${id}`)
  }

  async createClient(data: any) {
    return this.request("/clients", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateClient(id: string, data: any) {
    return this.request(`/clients/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteClient(id: string) {
    return this.request(`/clients/${id}`, {
      method: "DELETE",
    })
  }

  // Job methods
  async getJobs() {
    return this.request("/jobs")
  }

  async getJob(id: string) {
    return this.request(`/jobs/${id}`)
  }

  async createJob(data: any) {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateJob(id: string, data: any) {
    return this.request(`/jobs/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteJob(id: string) {
    return this.request(`/jobs/${id}`, {
      method: "DELETE",
    })
  }

  // Worker methods
  async getWorkers() {
    return this.request("/workers")
  }

  async createWorker(data: any) {
    return this.request("/workers", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Vehicle methods
  async getVehicles() {
    return this.request("/vehicles")
  }

  async createVehicle(data: any) {
    return this.request("/vehicles", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  // Cart methods
  async getCarts() {
    return this.request("/carts")
  }

  async createCart(data: any) {
    return this.request("/carts", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }
}

export const apiClient = new ApiClient()
