"use client"

import { useState, useEffect } from "react"
import { Receipt, Client, Job } from "@/entities/all" // Changed from Invoice, added Job
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Link, useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
import { format, parseISO } from "date-fns"
import {
  Trash2,
  Save,
  Printer,
  Mail,
  Edit3,
  CheckCircle,
  RotateCcw,
  X,
  ChevronLeft,
  CalendarClock, // Added as per outline, replaces CalendarDays in usage
} from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"

const BUSINESS_NAME_KEY = "vazana-business-name"
const BUSINESS_ADDRESS_KEY = "vazana-business-address"
const BUSINESS_PHONE_KEY = "vazana-business-phone"
const BUSINESS_VAT_ID_KEY = "vazana-business-vat-id"
const INVOICE_FOOTER_KEY = "vazana-invoice-footer"
const LOGO_URL =
  "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/f12425d59_VazanaLogo-05.png"

interface InvoiceItem {
  id: string
  receipt_number?: string
  vat_percentage?: number
  notes?: string
  status?: string
  issue_date?: string
  client_id?: string
  total_amount?: number
  [key: string]: any
}

export default function ViewInvoice() {
  // Renamed from ViewReceipt
  const navigate = useNavigate()
  const [item, setItem] = useState<InvoiceItem | null>(null) // Generic 'item' for the current "invoice" (data from Receipt)
  const [client, setClient] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSavingNotes, setIsSavingNotes] = useState(false) // Changed from isSavingNotes
  const [editingNotes, setEditingNotes] = useState(false) // Changed from isEditingNotes
  const [tempNotes, setTempNotes] = useState("") // Changed from editableNotes
  const [isMarkingPaid, setIsMarkingPaid] = useState(false)

  const [language, setLanguage] = useState(() => localStorage.getItem("vazana-language") || "he")
  const [businessInfo, setBusinessInfo] = useState({ name: "", address: "", phone: "", vatId: "" })
  const [invoiceFooter, setInvoiceFooter] = useState("") // Renamed from invoiceFooterText
  const [vatPercentage, setVatPercentage] = useState(18) // Default

  const urlParams = new URLSearchParams(window.location.search)
  const itemId = urlParams.get("id") // Renamed from invoiceId

  useEffect(() => {
    const storedVat = localStorage.getItem("vazana-default-vat")
    if (storedVat) setVatPercentage(Number.parseFloat(storedVat))

    setBusinessInfo({
      name: localStorage.getItem("vazana-business-name") || (language === "he" ? "שם העסק שלך" : "Your Company Name"),
      address:
        localStorage.getItem("vazana-business-address") ||
        (language === "he" ? "כתובת העסק שלך" : "Your Company Address"),
      phone:
        localStorage.getItem("vazana-business-phone") || (language === "he" ? "טלפון העסק שלך" : "Your Company Phone"),
      vatId:
        localStorage.getItem("vazana-business-vat-id") || (language === "he" ? 'מספר עוסק/ח"פ שלך' : "Your VAT ID"),
    })
    setInvoiceFooter(localStorage.getItem("vazana-invoice-footer") || "")

    const handleStorageChange = () => {
      const newLang = localStorage.getItem("vazana-language") || "he"
      if (newLang !== language) setLanguage(newLang)
      // ... also update businessInfo, footer, vatPercentage from localStorage if they change ...
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChanged", handleStorageChange) // Assuming you dispatch this custom event
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChanged", handleStorageChange)
    }
  }, [language, item?.vat_percentage, vatPercentage]) // Added item?.vat_percentage to dependency array

  const isHebrew = language === "he"

  const texts = {
    en: {
      pageTitlePrefix: "Invoice Details",
      backToArchive: "Back to Invoice Archive",
      clientDetails: "Client Details:",
      invoiceTitle: "Tax Invoice",
      invoiceNumberLabel: "Invoice #",
      dateIssuedLabel: "Date Issued",
      billingPeriodLabel: "Billing Period",
      jobNumShort: "Job #",
      workType: "Work Type",
      site: "Site",
      description: "Description",
      amount: "Amount (₪)",
      subtotal: "Subtotal",
      vat: (rate: number) => `VAT (${rate}%)`,
      total: "Total Amount",
      notesLabel: "Notes",
      editNotes: "Edit Notes",
      saveNotes: "Save Notes",
      cancelEdit: "Cancel",
      printInvoice: "Print Invoice",
      sendByEmail: "Send by Email",
      sendByWhatsApp: "Send by WhatsApp",
      markAsPaid: "Mark as Paid",
      deleteInvoice: "Delete Invoice",
      confirmDelete: "Are you sure you want to delete this invoice? This action cannot be undone.",
      invoicePaidSuccessfully: "Invoice marked as paid!",
      deleteFailed: "Failed to delete invoice.",
      notesSaved: "Notes saved!",
      loading: "Loading invoice details...",
      notFound: "Invoice not found.",
      statusLabel: "Status",
      statusDraft: "Draft",
      statusSent: "Sent",
      statusPaid: "Paid",
      statusVoid: "Void",
      statusPrinted: "Printed",
      expectedPaymentDate: "Expected Payment",
    },
    he: {
      pageTitlePrefix: "פרטי חשבונית",
      backToArchive: "חזור לארכיון חשבוניות",
      clientDetails: "פרטי לקוח:",
      invoiceTitle: "חשבונית מס",
      invoiceNumberLabel: "חשבונית #",
      dateIssuedLabel: "תאריך הפקה",
      billingPeriodLabel: "תקופת חיוב",
      jobNumShort: "מס' עבודה",
      workType: "סוג עבודה",
      site: "אתר",
      description: "תיאור / הערות",
      amount: "סכום (₪)",
      subtotal: "סכום ביניים",
      vat: (rate: number) => `מע"מ (${rate}%)`,
      total: "סכום כולל",
      notesLabel: "הערות",
      editNotes: "ערוך הערות",
      saveNotes: "שמור הערות",
      cancelEdit: "ביטול",
      printInvoice: "הדפס חשבונית",
      sendByEmail: "שלח באימייל",
      sendByWhatsApp: "שלח בוואטסאפ",
      markAsPaid: "סמן כשולם",
      deleteInvoice: "מחק חשבונית",
      confirmDelete: "האם אתה בטוח שברצונך למחוק חשבונית זו? לא ניתן לשחזר פעולה זו.",
      invoicePaidSuccessfully: "חשבונית סומנה כשולמה!",
      deleteFailed: "מחיקת החשבונית נכשלה.",
      notesSaved: "הערות נשמרו!",
      loading: "טוען פרטי חשבונית...",
      notFound: "חשבונית לא נמצאה.",
      statusLabel: "סטטוס",
      statusDraft: "טיוטה",
      statusSent: "נשלחה",
      statusPaid: "שולמה",
      statusVoid: "מבוטלת",
      statusPrinted: "הודפסה",
      expectedPaymentDate: "תשלום צפוי",
    },
  }
  const currentLang = language as keyof typeof texts
  const t = {
    ...texts[currentLang],
    vat: texts[currentLang].vat(item?.vat_percentage || vatPercentage), // Ensure item exists for vat_percentage
  }

  const statusTextMap = {
    draft: isHebrew ? "טיוטה" : "Draft",
    issued: isHebrew ? "הונפקה" : "Issued", // Changed "issued" to "sent" based on typical invoice statuses
    sent: isHebrew ? "נשלחה" : "Sent",
    paid: isHebrew ? "שולמה" : "Paid",
    cancelled: isHebrew ? "בוטלה" : "Cancelled",
    void: isHebrew ? "מבוטלת" : "Void",
    printed: isHebrew ? "הודפסה" : "Printed",
  }
  const statusColorMap = {
    draft: "bg-blue-100 text-blue-800 border-blue-300",
    issued: "bg-yellow-100 text-yellow-800 border-yellow-300",
    sent: "bg-yellow-100 text-yellow-800 border-yellow-300",
    paid: "bg-green-100 text-green-800 border-green-300",
    cancelled: "bg-red-100 text-red-800 border-red-300",
    void: "bg-red-100 text-red-800 border-red-300",
    printed: "bg-purple-100 text-purple-800 border-purple-300",
  }

  const loadItemAndClient = async () => {
    // Renamed from loadInvoiceAndClient
    if (!itemId) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    try {
      const fetchedItem = await Receipt.get(itemId) // Use Receipt.get()
      if (fetchedItem) {
        setItem(fetchedItem)
        setTempNotes(fetchedItem.notes || "")
        if (fetchedItem.client_id) {
          const fetchedClient = await Client.get(fetchedItem.client_id)
          setClient(fetchedClient)
        }
      } else {
        setItem(null) // Not found
      }
    } catch (error) {
      console.error("Error loading item (data source: Receipt):", error)
      setItem(null)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    loadItemAndClient()
  }, [itemId])

  const handleDelete = async () => {
    if (!item || isDeleting) return
    if (window.confirm(t.confirmDelete)) {
      setIsDeleting(true)
      try {
        await Receipt.delete(item.id) // Use Receipt.delete
        // Optionally update related jobs' payment_status if they were linked
        if (item.job_ids && item.job_ids.length > 0) {
          const jobUpdatePromises = item.job_ids.map(
            (jobId: string) => Job.update(jobId, { payment_status: "לתשלום", receipt_id: null }), // Revert status
          )
          await Promise.all(jobUpdatePromises)
        }
        navigate(createPageUrl("Invoices")) // Navigate to Invoices archive
      } catch (error) {
        console.error("Error deleting item:", error)
        alert(t.deleteFailed)
      }
      setIsDeleting(false)
    }
  }

  const handleSaveNotes = async () => {
    if (!item) return
    setIsSavingNotes(true)
    try {
      await Receipt.update(item.id, { notes: tempNotes }) // Use Receipt.update
      setItem((prev) => (prev ? { ...prev, notes: tempNotes } : null)) // Renamed
      setEditingNotes(false)
      alert(t.notesSaved)
    } catch (error) {
      console.error("Error saving notes:", error)
      alert(isHebrew ? "שגיאה בשמירת הערות." : "Error saving notes.") // Added specific alert
    }
    setIsSavingNotes(false)
  }

  const handleMarkAsPaid = async () => {
    if (!item || item.status === "paid") return
    setIsMarkingPaid(true)
    try {
      const updatedItem = await Receipt.update(item.id, { status: "paid" }) // Changed from Invoice
      setItem(updatedItem) // Renamed
      // Optionally update related jobs' payment_status
      if (item.job_ids && item.job_ids.length > 0) {
        const jobUpdatePromises = item.job_ids.map((jobId: string) => Job.update(jobId, { payment_status: "שולם" }))
        await Promise.all(jobUpdatePromises)
      }
      alert(t.invoicePaidSuccessfully)
    } catch (error) {
      console.error("Error marking item as paid:", error) // Changed
      alert(isHebrew ? "שגיאה בסימון החשבונית כשולמה." : "Error marking invoice as paid.") // Added specific alert
    }
    setIsMarkingPaid(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 md:p-8" dir={isHebrew ? "rtl" : "ltr"}>
        <div className="flex justify-between items-center mb-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-48" />
        </div>
        <Card className="shadow-xl border-neutral-200 bg-white">
          <CardHeader className="bg-primary-light p-6 border-b border-primary-light">
            <Skeleton className="h-8 w-80 mb-2" />
            <Skeleton className="h-4 w-96" />
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <Skeleton className="h-5 w-32 mb-1" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-4 w-36" />
              </div>
              <div className={isHebrew ? "text-left" : "text-right"}>
                <Skeleton className="h-7 w-56 mb-2" />
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-4 w-48 mb-1" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-48 w-full" /> {/* Table Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-start mt-6 gap-6">
              <div className="space-y-1">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-24 w-full" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-7 w-56" />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-6 border-t border-neutral-200 bg-neutral-50 flex justify-between items-center">
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-32" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-28" />
              <Skeleton className="h-9 w-32" />
            </div>
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (!item) {
    return (
      <div
        className="min-h-screen bg-neutral-50 p-4 md:p-8 flex flex-col items-center justify-center"
        dir={isHebrew ? "rtl" : "ltr"}
      >
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">{t.notFound}</h1>
        <Link to={createPageUrl("Invoices")}>
          <Button variant="outline" className="flex items-center gap-1 bg-transparent">
            <ChevronLeft className={`w-4 h-4 ${isHebrew ? "transform scale-x-[-1] ml-1" : "mr-1"}`} /> {t.backToArchive}
          </Button>
        </Link>
      </div>
    )
  }

  // Destructure item properties only AFTER confirming item is not null
  const {
    subtotal = 0,
    vat_amount = 0,
    total_amount = 0,
    line_items = [],
    notes = "",
    status = "draft",
    receipt_number = "N/A", // Changed from invoice_number
    client_name = "N/A",
    client_address = "",
    client_phone = "",
    receipt_date, // Changed from invoice_date
    period_start,
    period_end,
    expected_payment_date,
  } = item || {} // Ensure fallback if item is briefly null during state update

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`p-4 md:p-6 lg:p-8 ${isHebrew ? "rtl" : "ltr"}`}>
        {/* Back Button */}
        <div className="mb-6">
          <Link
            to={createPageUrl("Invoices")}
            className="inline-flex items-center text-primary hover:text-primary-dark"
          >
            <ChevronLeft className={`w-5 h-5 ${isHebrew ? "transform scale-x-[-1] ml-1" : "mr-1"}`} />
            {t.backToArchive}
          </Link>
        </div>

        <Card className="shadow-xl border-neutral-200 bg-white mx-auto max-w-4xl">
          <CardHeader
            className={`bg-primary-light text-primary p-6 border-b border-primary-light flex justify-between items-start`}
          >
            {/* Logo and Business Info */}
            <div className="flex items-start gap-4">
              <img
                src={LOGO_URL}
                alt="Logo"
                className="w-16 h-16 object-contain mt-1" // Adjusted logo style
              />
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold text-primary">{businessInfo.name}</CardTitle>
                <CardDescription className="text-primary/80 text-xs md:text-sm">
                  {businessInfo.address} | {businessInfo.phone} |{" "}
                  {isHebrew ? `ע.מ./ח"פ: ${businessInfo.vatId}` : `VAT ID: ${businessInfo.vatId}`}
                </CardDescription>
              </div>
            </div>
            {/* Page Title (optional, if needed here or just rely on breadcrumbs/main title) */}
            <div className={`${isHebrew ? "text-left" : "text-right"}`}>
              <h1 className="text-xl font-semibold text-neutral-700">
                {t.pageTitlePrefix} - {receipt_number}
              </h1>
            </div>
          </CardHeader>
          <CardContent className="p-6 md:p-8 space-y-6">
            {/* Client Info & Invoice Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <div>
                <h3 className="font-semibold text-neutral-700 mb-1">{t.clientDetails}</h3>
                <p className="text-neutral-800 font-medium">{client?.company_name || client_name}</p>
                {client?.contact_person && <p className="text-sm text-neutral-600">{client.contact_person}</p>}
                <p className="text-sm text-neutral-600">{client?.address || client_address}</p>
                <p className="text-sm text-neutral-600">{client?.phone || client_phone}</p>
              </div>
              <div className={`${isHebrew ? "md:text-left" : "md:text-right"}`}>
                <h2 className="text-xl md:text-2xl font-bold text-neutral-900">{t.invoiceTitle}</h2>
                <p className="text-neutral-600">
                  <span className="font-medium">{t.invoiceNumberLabel}</span> {receipt_number}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">{t.dateIssuedLabel}:</span>{" "}
                  {receipt_date ? format(parseISO(receipt_date), "dd/MM/yyyy") : "N/A"}
                </p>
                <p className="text-neutral-600">
                  <span className="font-medium">{t.billingPeriodLabel}:</span>
                  {period_start && period_end
                    ? `${format(parseISO(period_start), "dd/MM/yy")} - ${format(parseISO(period_end), "dd/MM/yy")}`
                    : isHebrew
                      ? "לא צוין"
                      : "N/A"}
                </p>
                {expected_payment_date && (
                  <p
                    className="text-neutral-600 flex items-center gap-1 mt-1"
                    style={{ justifyContent: isHebrew ? "flex-end" : "flex-start" }}
                  >
                    <CalendarClock className="w-4 h-4 text-neutral-500" /> {/* Changed from CalendarDays */}
                    <span className="font-medium">{t.expectedPaymentDate}:</span>{" "}
                    {format(parseISO(expected_payment_date), "dd/MM/yyyy")}
                  </p>
                )}
                <div className={`mt-2 ${isHebrew ? "text-left" : "text-right"}`}>
                  <Badge
                    variant="outline"
                    className={`text-sm ${statusColorMap[status as keyof typeof statusColorMap] || "bg-neutral-100 text-neutral-800"}`}
                  >
                    {statusTextMap[status as keyof typeof statusTextMap] || status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="overflow-x-auto">
              <Table className="min-w-full border-neutral-200">
                <TableHeader className="bg-neutral-50">
                  <TableRow>
                    <TableHead className="text-neutral-700 font-semibold w-[10%]">{t.jobNumShort}</TableHead>
                    <TableHead className="text-neutral-700 font-semibold w-[15%]">{t.workType}</TableHead>
                    <TableHead className="text-neutral-700 font-semibold w-[15%]">{t.site}</TableHead>
                    <TableHead className="text-neutral-700 font-semibold w-[40%]">{t.description}</TableHead>
                    <TableHead
                      className={`text-neutral-700 font-semibold w-[20%] ${isHebrew ? "text-left" : "text-right"}`}
                    >
                      {t.amount}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(line_items) &&
                    line_items.map((line, index) => (
                      <TableRow key={index} className="border-b-neutral-100">
                        <TableCell className="py-3 text-neutral-700">
                          {line.job_number || (isHebrew ? "ידני" : "Manual")}
                        </TableCell>
                        <TableCell className="py-3 text-neutral-700">{line.work_type_name || "-"}</TableCell>
                        <TableCell className="py-3 text-neutral-700">{line.site_name || "-"}</TableCell>
                        <TableCell className="py-3 text-neutral-700">{line.description}</TableCell>
                        <TableCell className={`py-3 text-neutral-700 ${isHebrew ? "text-left" : "text-right"}`}>
                          ₪{Number.parseFloat(line.amount).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>

            {/* Totals and Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 items-start mt-6 gap-6">
              <div className="space-y-1">
                <h4 className="font-semibold text-neutral-700">{t.notesLabel}:</h4>
                {editingNotes ? (
                  <>
                    <Textarea
                      value={tempNotes}
                      onChange={(e) => setTempNotes(e.target.value)}
                      rows={3}
                      className="border-neutral-300 focus:border-primary"
                    />
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="bg-primary hover:bg-primary-dark text-primary-foreground"
                      >
                        {isSavingNotes ? (
                          <RotateCcw className="w-3 h-3 mr-1 animate-spin" />
                        ) : (
                          <Save className="w-3 h-3 mr-1" />
                        )}
                        {t.saveNotes}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNotes(false)
                          setTempNotes(notes)
                        }}
                      >
                        <X className="w-3 h-3 mr-1" />
                        {t.cancelEdit}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-neutral-600 whitespace-pre-wrap min-h-[40px]">
                      {notes || (isHebrew ? "אין הערות." : "No notes.")}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setEditingNotes(true)}
                      className="text-primary hover:text-primary-dark p-1"
                    >
                      <Edit3 className="w-3 h-3 mr-1" />
                      {t.editNotes}
                    </Button>
                  </>
                )}
              </div>
              <div className={`space-y-2 ${isHebrew ? "md:text-left" : "md:text-right"}`}>
                <div className="flex justify-between text-neutral-700">
                  <span>{t.subtotal}:</span>
                  <span>₪{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-700">
                  <span>{t.vat}:</span> {/* vat already includes percentage from t object */}
                  <span>₪{vat_amount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-neutral-900 font-bold text-lg border-t border-neutral-200 pt-2 mt-1">
                  <span>{t.total}:</span>
                  <span>₪{total_amount.toFixed(2)}</span>
                </div>
              </div>
            </div>
            {invoiceFooter && (
              <div className="mt-6 pt-4 border-t border-neutral-200">
                <p className="text-xs text-neutral-500 text-center whitespace-pre-wrap">{invoiceFooter}</p>
              </div>
            )}
          </CardContent>
          <CardFooter className="p-6 border-t border-neutral-200 bg-neutral-50 flex flex-wrap justify-end items-center gap-3">
            <Button
              variant="outline"
              className="flex items-center gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-200 bg-transparent"
              onClick={() => window.print()}
            >
              <Printer className="w-4 h-4" /> {t.printInvoice}
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 border-neutral-300 text-neutral-700 hover:bg-neutral-200 bg-transparent"
              onClick={() => alert(isHebrew ? "שליחה באימייל (מדומה)" : "Send by Email (Mock)")}
            >
              <Mail className="w-4 h-4" /> {t.sendByEmail}
            </Button>
            {item.status !== "paid" && (
              <Button
                onClick={handleMarkAsPaid}
                disabled={isMarkingPaid}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
              >
                {isMarkingPaid ? <RotateCcw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}{" "}
                {t.markAsPaid}
              </Button>
            )}
            {item.status === "draft" && ( // Only allow deletion if draft
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
              >
                {isDeleting ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t.deleteInvoice}
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
