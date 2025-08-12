"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Mail, Calendar, Send, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface NotificationCenterProps {
  jobId: string
  jobNumber: string
  clientEmail?: string
  workerEmail?: string
}

export default function NotificationCenter({ jobId, jobNumber, clientEmail, workerEmail }: NotificationCenterProps) {
  const [notificationType, setNotificationType] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [customMessage, setCustomMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleSendNotification = async () => {
    if (!notificationType || !recipientEmail) {
      toast({
        title: "Missing Information",
        description: "Please select notification type and recipient email",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: notificationType,
          jobId,
          recipientEmail,
          additionalData: {
            customMessage,
            daysOverdue: notificationType === "payment_reminder" ? 7 : undefined,
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to send notification")
      }

      toast({
        title: "Notification Sent",
        description: `${notificationType.replace("_", " ")} notification sent successfully`,
      })

      // Reset form
      setNotificationType("")
      setRecipientEmail("")
      setCustomMessage("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCalendar = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/calendar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jobId }),
      })

      if (!response.ok) {
        throw new Error("Failed to add to calendar")
      }

      toast({
        title: "Calendar Event Created",
        description: `Job #${jobNumber} has been added to your calendar`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add event to calendar",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Email Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <div>
              <CardTitle>Email Notifications</CardTitle>
              <CardDescription>Send automated notifications for this job</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Notification Type</label>
              <Select value={notificationType} onValueChange={setNotificationType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select notification type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="job_assignment">Job Assignment</SelectItem>
                  <SelectItem value="job_completion">Job Completion</SelectItem>
                  <SelectItem value="payment_reminder">Payment Reminder</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Recipient Email</label>
              <Select value={recipientEmail} onValueChange={setRecipientEmail}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recipient" />
                </SelectTrigger>
                <SelectContent>
                  {clientEmail && <SelectItem value={clientEmail}>Client: {clientEmail}</SelectItem>}
                  {workerEmail && <SelectItem value={workerEmail}>Worker: {workerEmail}</SelectItem>}
                  <SelectItem value="custom">Custom Email...</SelectItem>
                </SelectContent>
              </Select>
              {recipientEmail === "custom" && (
                <Input
                  placeholder="Enter email address"
                  value={customMessage}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                />
              )}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Additional Message (Optional)</label>
            <Textarea
              placeholder="Add a custom message to include with the notification..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button onClick={handleSendNotification} disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Send Notification
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Calendar Integration */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-green-600" />
            <div>
              <CardTitle>Calendar Integration</CardTitle>
              <CardDescription>Add this job to your calendar</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button onClick={handleAddToCalendar} disabled={loading} variant="outline" className="w-full bg-transparent">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding to Calendar...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Add to Google Calendar
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
