// Device-native calendar integration via .ics file generation
// Works on any device: Google Calendar (Android), Outlook (Windows), Apple Calendar (iOS/Mac)

interface JobCalendarData {
  jobNumber: string
  clientName: string
  workerName: string
  jobDate: string // YYYY-MM-DD
  site: string
  city: string
  workType: string
  shiftType: string // Hebrew: "יום" | "לילה" | "כפול"
  notes?: string
}

/**
 * Generates an .ics calendar event string from job data.
 * Shift times:
 *   יום (day):   08:00–16:00
 *   לילה (night): 20:00–06:00 (+1 day)
 *   כפול (double): 08:00–06:00 (+1 day)
 */
function generateICSContent(job: JobCalendarData): string {
  const date = new Date(job.jobDate)
  let startHour: number
  let endHour: number
  let endDayOffset = 0

  switch (job.shiftType) {
    case "לילה":
      startHour = 20
      endHour = 6
      endDayOffset = 1
      break
    case "כפול":
      startHour = 8
      endHour = 6
      endDayOffset = 1
      break
    case "יום":
    default:
      startHour = 8
      endHour = 16
      break
  }

  const startDate = new Date(date)
  startDate.setHours(startHour, 0, 0, 0)

  const endDate = new Date(date)
  endDate.setDate(endDate.getDate() + endDayOffset)
  endDate.setHours(endHour, 0, 0, 0)

  const formatDate = (d: Date): string => {
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
  }

  const uid = `vazana-job-${job.jobNumber}-${Date.now()}@vazana.studio`
  const now = formatDate(new Date())

  const description = [
    `סוג עבודה: ${job.workType}`,
    `לקוח: ${job.clientName}`,
    `עובד: ${job.workerName}`,
    `אתר: ${job.site}, ${job.city}`,
    `משמרת: ${job.shiftType}`,
    job.notes ? `הערות: ${job.notes}` : "",
    "",
    "נוצר ע\"י וזאנה סטודיו",
  ]
    .filter(Boolean)
    .join("\\n")

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Vazana Studio//Job Calendar//HE",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;TZID=Asia/Jerusalem:${formatDate(startDate)}`,
    `DTEND;TZID=Asia/Jerusalem:${formatDate(endDate)}`,
    `SUMMARY:עבודה #${job.jobNumber} - ${job.clientName}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${job.site}, ${job.city}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n")
}

/**
 * Triggers a browser download of a .ics file for the given job.
 */
export function downloadJobICS(job: JobCalendarData): void {
  const icsContent = generateICSContent(job)
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" })
  const url = URL.createObjectURL(blob)

  const link = document.createElement("a")
  link.href = url
  link.download = `vazana-job-${job.jobNumber}.ics`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
