import React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, Printer } from "lucide-react"

interface Job {
  id: string
  job_number: string
  work_type: string
  job_date: string
  site: string
  city: string
  total_amount: number
}

interface InvoicePreviewModalProps {
  isOpen: boolean
  onClose: () => void
  selectedJobs: Job[]
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
  clientName,
  summary,
  notes,
  paymentTerms,
  includeBankDetails
}: InvoicePreviewModalProps) {
  
  // Get business details from localStorage (from settings)
  const businessName = typeof window !== 'undefined' ? localStorage.getItem('vazana-business-name') || 'חברת ואזנה' : 'חברת ואזנה'
  const businessAddress = typeof window !== 'undefined' ? localStorage.getItem('vazana-business-address') || 'כתובת החברה' : 'כתובת החברה'
  const businessPhone = typeof window !== 'undefined' ? localStorage.getItem('vazana-business-phone') || '050-1234567' : '050-1234567'
  const businessEmail = typeof window !== 'undefined' ? localStorage.getItem('vazana-business-email') || 'info@vazana.com' : 'info@vazana.com'
  
  // Bank details
  const bankAccountName = typeof window !== 'undefined' ? localStorage.getItem('vazana-bank-account-name') || 'חברת ואזנה בע"מ' : 'חברת ואזנה בע"מ'
  const bankName = typeof window !== 'undefined' ? localStorage.getItem('vazana-bank-name') || 'בנק לאומי' : 'בנק לאומי'
  const bankBranch = typeof window !== 'undefined' ? localStorage.getItem('vazana-bank-branch') || '123' : '123'
  const bankAccountNumber = typeof window !== 'undefined' ? localStorage.getItem('vazana-bank-account-number') || '12-345-678901' : '12-345-678901'
  
  const currentDate = new Date().toLocaleDateString('he-IL')
  const dueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('he-IL') // 30 days from now
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[62vw] !max-w-none max-h-[90vh] overflow-hidden bg-white border-0 shadow-2xl" dir="rtl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="text-xl font-bold">תצוגה מקדימה - חשבונית</DialogTitle>
        </DialogHeader>
        
        <div className="overflow-y-auto px-1 max-h-[calc(90vh-180px)] scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
          {/* Invoice Preview */}
          <div className="bg-white border border-gray-200 p-8 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex justify-between items-start mb-8">
            <div className="text-right">
              <h1 className="text-3xl font-bold text-teal-600 mb-2">חשבונית</h1>
              <div className="text-sm text-gray-600">
                <p>מספר: INV-2025-0001</p>
                <p>תאריך: {currentDate}</p>
                <p>תאריך פרעון: {dueDate}</p>
              </div>
            </div>
            
            <div className="text-left">
              <h2 className="text-xl font-bold text-gray-800 mb-2">{businessName}</h2>
              <div className="text-sm text-gray-600">
                <p>{businessAddress}</p>
                <p>טלפון: {businessPhone}</p>
                <p>דוא"ל: {businessEmail}</p>
              </div>
            </div>
          </div>
          
          {/* Client Details */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">לכבוד:</h3>
            <div className="bg-gray-50 p-4 rounded">
              <p className="font-medium">{clientName}</p>
            </div>
          </div>
          
          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full border border-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">סכום (₪)</th>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">אתר</th>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">סוג עבודה</th>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">תאריך</th>
                  <th className="border border-gray-200 p-3 text-right text-sm font-medium">מספר עבודה</th>
                </tr>
              </thead>
              <tbody>
                {selectedJobs.map((job) => (
                  <tr key={job.id}>
                    <td className="border border-gray-200 p-3 text-right font-medium">
                      ₪{(job.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="border border-gray-200 p-3 text-right">{job.site}, {job.city}</td>
                    <td className="border border-gray-200 p-3 text-right">{job.work_type}</td>
                    <td className="border border-gray-200 p-3 text-right">
                      {new Date(job.job_date).toLocaleDateString('he-IL')}
                    </td>
                    <td className="border border-gray-200 p-3 text-right">#{job.job_number}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Summary */}
          <div className="flex justify-end mb-8">
            <div className="w-64">
              <div className="flex justify-between py-2 border-b">
                <span>₪{summary.subtotal.toLocaleString()}</span>
                <span>סכום חלקי:</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>₪{summary.tax_amount.toLocaleString()}</span>
                <span>מע"מ (18%):</span>
              </div>
              <div className="flex justify-between py-3 text-lg font-bold bg-gray-50 px-3 rounded">
                <span>₪{summary.total_amount.toLocaleString()}</span>
                <span>סכום כולל:</span>
              </div>
            </div>
          </div>
          
          {/* Notes */}
          {notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">הערות:</h3>
              <div className="bg-gray-50 p-4 rounded">
                <p className="text-sm">{notes}</p>
              </div>
            </div>
          )}
          
          {/* Payment Terms */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">תנאי תשלום:</h3>
            <p className="text-sm">{paymentTerms}</p>
          </div>
          
          {/* Bank Details */}
          {includeBankDetails && (
            <div className="mb-8 border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">פרטי חשבון בנק:</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">שם החשבון:</span> {bankAccountName}
                </div>
                <div>
                  <span className="font-medium">בנק:</span> {bankName}
                </div>
                <div>
                  <span className="font-medium">סניף:</span> {bankBranch}
                </div>
                <div>
                  <span className="font-medium">מספר חשבון:</span> {bankAccountNumber}
                </div>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="text-center text-xs text-gray-500 border-t pt-4">
            <p>תודה על העסק!</p>
          </div>
        </div>
        </div>
        
        {/* Action Buttons - Fixed positioning */}
        <div className="sticky bottom-0 bg-white border-t pt-4 flex gap-4 justify-center mt-6 z-10">
          <Button variant="outline" className="flex items-center gap-2">
            <Printer className="h-4 w-4" />
            הדפס
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
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

// Also export as default for compatibility
export default InvoicePreviewModal
