/**
 * Google Drive API v3 — upload files to Drive.
 * Uses multipart upload via raw fetch.
 */

import { getValidToken } from "@/lib/google-auth"

const DRIVE_UPLOAD_URL =
  "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"

interface UploadResult {
  success: boolean
  fileId?: string
  error?: string
}

/**
 * Upload a file (backup JSON, CSV, etc.) to Google Drive.
 *
 * @param userId   - Supabase user ID
 * @param filename - Name for the file in Drive (e.g. "backup-2026-04-02.json")
 * @param content  - String content of the file
 * @param folderId - Optional Drive folder ID to upload into
 */
export async function uploadBackupToDrive(
  userId: string,
  filename: string,
  content: string,
  folderId?: string
): Promise<UploadResult> {
  const token = await getValidToken(userId)
  if (!token) {
    return { success: false, error: "אין חיבור Google פעיל — יש להתחבר מהגדרות" }
  }

  // Build multipart body per Google Drive API spec
  const boundary = "vazana_drive_boundary"
  const metadata: Record<string, unknown> = {
    name: filename,
    mimeType: "application/json",
  }

  if (folderId) {
    metadata.parents = [folderId]
  }

  const multipartBody = [
    `--${boundary}`,
    "Content-Type: application/json; charset=UTF-8",
    "",
    JSON.stringify(metadata),
    `--${boundary}`,
    "Content-Type: application/json",
    "",
    content,
    `--${boundary}--`,
  ].join("\r\n")

  const res = await fetch(DRIVE_UPLOAD_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": `multipart/related; boundary=${boundary}`,
    },
    body: multipartBody,
  })

  if (!res.ok) {
    const body = await res.text()
    console.error("[google-drive] Upload failed:", res.status, body)
    return { success: false, error: `העלאה ל-Drive נכשלה (${res.status})` }
  }

  const data = await res.json()
  return { success: true, fileId: data.id }
}
