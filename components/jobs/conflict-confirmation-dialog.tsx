"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

interface ConflictConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  warnings: string[]
  onConfirm: () => void
}

export default function ConflictConfirmationDialog({
  open,
  onOpenChange,
  warnings,
  onConfirm,
}: ConflictConfirmationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-hebrew text-red-700">
            <AlertTriangle className="w-5 h-5" />
            נמצאו התנגשויות
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-2">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 space-y-2">
            {warnings.map((w, i) => (
              <p key={i} className="text-sm text-red-700 font-hebrew font-medium">{w}</p>
            ))}
          </div>
          <p className="text-sm text-gray-600 font-hebrew">
            האם להמשיך בשמירת העבודה למרות ההתנגשויות?
          </p>
          <div className="flex gap-2 justify-start pt-2">
            <Button
              onClick={() => {
                onConfirm()
                onOpenChange(false)
              }}
              className="bg-red-600 hover:bg-red-700 text-white font-hebrew"
            >
              המשך בכל זאת
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="font-hebrew"
            >
              חזור לטופס
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
