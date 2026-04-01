import { type NextRequest, NextResponse } from "next/server"
import { DocumentService } from "@/lib/document-service"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const documentService = new DocumentService()

    // Get document metadata
    const docs = await documentService.getDocuments()
    const doc = docs.find(d => d.id === id)

    if (!doc) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 })
    }

    // Get signed download URL
    const url = await documentService.getDownloadUrl(doc.file_path)

    // Redirect to the signed URL
    return NextResponse.redirect(url)
  } catch (error: any) {
    console.error("Download error:", error?.message || error)
    return NextResponse.json({ error: error?.message || "Download failed" }, { status: 500 })
  }
}
