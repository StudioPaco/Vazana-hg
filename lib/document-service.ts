import { createClient } from "@supabase/supabase-js"

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
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
    const filename = `${Date.now()}-${file.name}`
    const filePath = `documents/${entityType}/${filename}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("documents")
      .upload(filePath, file)

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
