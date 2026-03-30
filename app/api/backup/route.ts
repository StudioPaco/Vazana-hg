import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Export all critical tables
    const tables = ['clients', 'jobs', 'workers', 'vehicles', 'carts', 'work_types', 'invoices', 'invoice_line_items', 'business_settings', 'user_profiles']
    const backup: Record<string, any[]> = {}

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*')
      if (!error) {
        backup[table] = data || []
      }
    }

    const backupJson = JSON.stringify({
      version: "1.0",
      created_at: new Date().toISOString(),
      created_by: user.email,
      tables: backup,
    }, null, 2)

    const body = await request.json().catch(() => ({}))
    const { action } = body

    if (action === 'download') {
      // Return as downloadable JSON
      return new NextResponse(backupJson, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="vazana-backup-${new Date().toISOString().split('T')[0]}.json"`,
        },
      })
    }

    if (action === 'google-drive') {
      // Upload to Google Drive
      const { accessToken, folderId } = body

      if (!accessToken) {
        return NextResponse.json({ error: "Google Drive access token required" }, { status: 400 })
      }

      const filename = `vazana-backup-${new Date().toISOString().split('T')[0]}.json`

      // Create file metadata
      const metadata = {
        name: filename,
        mimeType: 'application/json',
        ...(folderId ? { parents: [folderId] } : {}),
      }

      // Use multipart upload
      const boundary = 'vazana_backup_boundary'
      const multipartBody =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${backupJson}\r\n` +
        `--${boundary}--`

      const driveResponse = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body: multipartBody,
        }
      )

      if (!driveResponse.ok) {
        const driveError = await driveResponse.text()
        console.error('Google Drive upload failed:', driveError)
        return NextResponse.json({ error: "Google Drive upload failed" }, { status: 500 })
      }

      const driveFile = await driveResponse.json()
      return NextResponse.json({
        success: true,
        fileId: driveFile.id,
        filename,
        message: "Backup uploaded to Google Drive"
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("Backup error:", error)
    return NextResponse.json({ error: "Backup failed" }, { status: 500 })
  }
}
