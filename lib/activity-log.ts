import { createAdminClient } from "@/lib/supabase/admin"

export async function logActivity(
  userId: string | undefined,
  userName: string | undefined,
  action: string,
  entityType?: string,
  entityId?: string,
  details?: Record<string, any>
) {
  try {
    const supabase = createAdminClient()
    await supabase.from("activity_log").insert({
      user_id: userId || null,
      user_name: userName || "system",
      action,
      entity_type: entityType,
      entity_id: entityId,
      details: details || null,
    })
  } catch (error) {
    // Don't throw — activity logging should never break the main flow
    console.error("Activity log failed:", error)
  }
}
