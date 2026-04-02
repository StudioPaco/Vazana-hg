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
    const signedUrl = await documentService.getDownloadUrl(doc.file_path)

    // Fetch the file server-side and stream it back with Content-Disposition: attachment
    // This forces the browser to download instead of opening the file
    const fileResponse = await fetch(signedUrl)

    if (!fileResponse.ok) {
      return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 })
    }

    const fileBuffer = await fileResponse.arrayBuffer()
    const contentType = doc.mime_type || fileResponse.headers.get("content-type") || "application/octet-stream"

    // Encode filename for Content-Disposition (supports Hebrew/Unicode)
    const encodedFilename = encodeURIComponent(doc.filename)

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`,
        "Content-Length": String(fileBuffer.byteLength),
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error("Download error:", message)
    return NextResponse.json({ error: message || "Download failed" }, { status: 500 })
  }
}
