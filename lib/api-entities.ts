// API-based entity wrapper for resources management
// This replaces the old direct Supabase entities with API calls

interface ApiEntity {
  list: () => Promise<any[]>
  create: (data: any) => Promise<any>
  update: (id: string, data: any) => Promise<any>
  delete: (id: string) => Promise<void>
  tableName: string
}

class BaseApiEntity implements ApiEntity {
  tableName: string

  constructor(tableName: string) {
    this.tableName = tableName
  }

  async list() {
    try {
      const response = await fetch(`/api/${this.tableName}`)
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error(`Error loading ${this.tableName}:`, error)
      return []
    }
  }

  async create(data: any) {
    try {
      const response = await fetch(`/api/${this.tableName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error)
      throw error
    }
  }

  async update(id: string, data: any) {
    try {
      // For most resources, use PUT with id in body
      const response = await fetch(`/api/${this.tableName}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error)
      throw error
    }
  }

  async delete(id: string) {
    try {
      // For most resources, use DELETE with query parameter
      const response = await fetch(`/api/${this.tableName}?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      // Return void as expected by the interface
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error)
      throw error
    }
  }
}

// Export API-based entities
export const Worker = new BaseApiEntity('workers')
export const Vehicle = new BaseApiEntity('vehicles')
export const Cart = new BaseApiEntity('carts')

// Special Client entity that uses individual ID routes
export const Client = {
  tableName: 'clients',
  
  async list() {
    try {
      const response = await fetch('/api/clients')
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error loading clients:', error)
      return []
    }
  },

  async create(data: any) {
    try {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error creating clients:', error)
      throw error
    }
  },

  async update(id: string, data: any) {
    try {
      // Clients use individual ID routes
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error updating clients:', error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      // Clients use individual ID routes
      const response = await fetch(`/api/clients/${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      // Return void as expected by the interface
    } catch (error) {
      console.error('Error deleting clients:', error)
      throw error
    }
  }
}
// Special handling for work-types since it has different API structure
export const WorkType = {
  tableName: 'work-types',
  
  async list() {
    try {
      const response = await fetch('/api/work-types')
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data || []
    } catch (error) {
      console.error('Error loading work-types:', error)
      return []
    }
  },

  async create(data: any) {
    try {
      const response = await fetch('/api/work-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error creating work-types:', error)
      throw error
    }
  },

  async update(id: string, data: any) {
    try {
      // For now, use PUT on the main route with id in body
      const response = await fetch('/api/work-types', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id, ...data }),
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      const result = await response.json()
      return result.data
    } catch (error) {
      console.error('Error updating work-types:', error)
      throw error
    }
  },

  async delete(id: string) {
    try {
      // For now, use DELETE with query parameter
      const response = await fetch(`/api/work-types?id=${id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`)
      }
      
      // Return void as expected by the interface
    } catch (error) {
      console.error('Error deleting work-types:', error)
      throw error
    }
  }
}

// For backward compatibility, also export as classes
export class WorkerEntity extends BaseApiEntity {
  constructor() {
    super('workers')
  }
}

export class VehicleEntity extends BaseApiEntity {
  constructor() {
    super('vehicles')
  }
}

export class CartEntity extends BaseApiEntity {
  constructor() {
    super('carts')
  }
}

export class ClientEntity extends BaseApiEntity {
  constructor() {
    super('clients')
  }
}

export class WorkTypeEntity extends BaseApiEntity {
  constructor() {
    super('work-types')
  }
}