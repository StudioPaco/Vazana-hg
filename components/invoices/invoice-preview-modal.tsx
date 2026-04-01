import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Download, Printer } from "lucide-react"
import InvoiceTemplate, { getInvoicePrintHTML } from "./invoice-template"

interface Job {
  id: string
  job_number: string
  work_type: string
  job_date: string
  site: string
  city: string
  total_amount: number
}

interface ManualItem {
  description: string
  job_date?: string
  unit_price: number
  work_type?: string
  site?: string
}

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  selectedJobs: Job[]
  manualItems?: ManualItem[]
  invoiceNumber?: string
  clientName: string
  summary: {
    subtotal: number
    tax_amount: number
    total_amount: number
  }
  notes: string
  paymentTerms: string
  includeBankDetails: boolean
}

export function InvoicePreviewModal({
  isOpen,
  onClose,
  selectedJobs,
  manualItems = [],
  invoiceNumber = '',
  clientName,
  summary,
  notes,
  paymentTerms,
  includeBankDetails
}: InvoicePreviewModalProps) {

  const handlePrint = () => {
    const el = document.getElementById('invoice-preview-content')
    if (!el) return
    const html = getInvoicePrintHTML(el, invoiceNumber)
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  const handleDownloadPDF = () => {
    const el = document.getElementById('invoice-preview-content')
    if (!el) return
    const html = getInvoicePrintHTML(el, invoiceNumber)
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html + '<script>setTimeout(function(){window.print()},600);</script>')
    w.document.close()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[62vw] !max-w-none max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold font-hebrew text-right">תצוגה מקדימה — חשבונית</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto px-1 max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          <div id="invoice-preview-content">
            <InvoiceTemplate
              invoiceNumber={invoiceNumber}
              clientName={clientName}
              selectedJobs={selectedJobs}
              manualItems={manualItems}
              summary={summary}
              notes={notes}
              paymentTerms={paymentTerms}
              includeBankDetails={includeBankDetails}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="sticky bottom-0 bg-white border-t pt-4 flex gap-4 justify-center mt-6 z-10 print:hidden">
          <Button variant="outline" className="flex items-center gap-2" onClick={handlePrint}>
            <Printer className="h-4 w-4" />
            הדפס
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4" />
            הורד PDF
          </Button>
          <Button onClick={onClose} className="bg-teal-600 hover:bg-teal-700">
            סגור
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Default export for backward compatibility
export default InvoicePreviewModal
