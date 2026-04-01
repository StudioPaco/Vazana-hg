import { createAdminClient } from "@/lib/supabase/admin"

function getSupabase() {
  return createAdminClient()
}

export interface Document {
  id: string
  filename: string
  file_path: string
  file_size: number
  mime_type: string
  entity_type: "job" | "client" | "invoice" | "general"
  entity_id?: string
  uploaded_by: string
  created_at: string
  updated_at: string
}

export class DocumentService {
  async uploadDocument(file: File, entityType: Document["entity_type"], entityId?: string): Promise<Document> {
    const supabase = getSupabase()
    // Sanitize filename — remove Hebrew chars that may cause issues
    const safeName = file.name.replace(/[^\w.-]/g, '_')
    const filename = `${Date.now()}-${safeName}`
    const filePath = `${entityType}/${filename}`

    // Convert File to Buffer for server-side upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Save document metadata to database
    const { data, error } = await supabase
      .from("documents")
      .insert({
        filename: file.name,
        file_path: filePath,
        file_size: file.size,
        mime_type: file.type,
        entity_type: entityType,
        entity_id: entityId,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Database save failed: ${error.message}`)
    }

    return data
  }

  async getDocuments(entityType?: string, entityId?: string): Promise<Document[]> {
    const supabase = getSupabase()
    let query = supabase.from("documents").select("*")

    if (entityType) {
      query = query.eq("entity_type", entityType)
    }
    if (entityId) {
      query = query.eq("entity_id", entityId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`)
    }

    return data || []
  }

  async deleteDocument(id: string): Promise<void> {
    const supabase = getSupabase()
    // Get document info first
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("file_path")
      .eq("id", id)
      .single()

    if (fetchError) {
      throw new Error(`Document not found: ${fetchError.message}`)
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage.from("documents").remove([doc.file_path])

    if (storageError) {
      throw new Error(`Storage deletion failed: ${storageError.message}`)
    }

    // Delete from database
    const { error: dbError } = await supabase.from("documents").delete().eq("id", id)

    if (dbError) {
      throw new Error(`Database deletion failed: ${dbError.message}`)
    }
  }

  async getDownloadUrl(filePath: string): Promise<string> {
    const supabase = getSupabase()
    const { data, error } = await supabase.storage.from("documents").createSignedUrl(filePath, 3600)

    if (error) {
      throw new Error(`Failed to create download URL: ${error.message}`)
    }

    return data.signedUrl
  }
}
