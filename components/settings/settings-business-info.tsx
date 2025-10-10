"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Save, Briefcase, ArrowLeft, AlertTriangle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { createPageUrl } from "@/utils"
// Import Receipt entity if we were to implement the "Apply to Active Invoices"
// For now, it's not strictly needed for the mock button.
// import { Receipt } from "@/entities/Receipt";

// localStorage keys
const BUSINESS_NAME_KEY = "vazana-business-name"
const BUSINESS_ADDRESS_KEY = "vazana-business-address"
const BUSINESS_PHONE_KEY = "vazana-business-phone"
const BUSINESS_VAT_ID_KEY = "vazana-business-vat-id"
const BUSINESS_EMAIL_KEY = "vazana-business-email" // New
const BANK_ACCOUNT_NAME_KEY = "vazana-bank-account-name"
const BANK_NAME_KEY = "vazana-bank-name"
const BANK_BRANCH_KEY = "vazana-bank-branch"
const BANK_ACCOUNT_NUMBER_KEY = "vazana-bank-account-number"

export default function SettingsBusinessInfo() {
  const navigate = useNavigate()
  const [language, setLanguage] = useState(() => localStorage.getItem("vazana-language") || "he")

  const [businessName, setBusinessName] = useState(() => localStorage.getItem(BUSINESS_NAME_KEY) || "")
  const [businessAddress, setBusinessAddress] = useState(() => localStorage.getItem(BUSINESS_ADDRESS_KEY) || "")
  const [businessPhone, setBusinessPhone] = useState(() => localStorage.getItem(BUSINESS_PHONE_KEY) || "")
  const [businessVatId, setBusinessVatId] = useState(() => localStorage.getItem(BUSINESS_VAT_ID_KEY) || "")
  const [businessEmail, setBusinessEmail] = useState(() => localStorage.getItem(BUSINESS_EMAIL_KEY) || "") // New
  
  // Bank account information
  const [bankAccountName, setBankAccountName] = useState(() => localStorage.getItem(BANK_ACCOUNT_NAME_KEY) || "")
  const [bankName, setBankName] = useState(() => localStorage.getItem(BANK_NAME_KEY) || "")
  const [bankBranch, setBankBranch] = useState(() => localStorage.getItem(BANK_BRANCH_KEY) || "")
  const [bankAccountNumber, setBankAccountNumber] = useState(() => localStorage.getItem(BANK_ACCOUNT_NUMBER_KEY) || "")
  
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem("vazana-language") || "he"
      if (newLang !== language) setLanguage(newLang)
    }
    window.addEventListener("storage", handleStorageChange)
    window.addEventListener("languageChanged", handleStorageChange)
    return () => {
      window.removeEventListener("storage", handleStorageChange)
      window.removeEventListener("languageChanged", handleStorageChange)
    }
  }, [language])

  const isHebrew = language === "he"

  const texts = {
    en: {
      title: "Business Information",
      subtitle: "Manage your company details for invoices and official documents.",
      businessNameLabel: "Business Name",
      businessNamePlaceholder: "e.g., Your Company LLC",
      businessAddressLabel: "Business Address",
      businessAddressPlaceholder: "e.g., 123 Main St, City, Country",
      businessPhoneLabel: "Business Phone",
      businessPhonePlaceholder: "e.g., +1-555-123-4567",
      businessVatIdLabel: "VAT ID / Company ID",
      businessVatIdPlaceholder: "e.g., IE1234567X",
      businessEmailLabel: "Business Email", // New
      businessEmailPlaceholder: "e.g., contact@yourcompany.com", // New
      bankAccountNameLabel: "Account Name",
      bankAccountNamePlaceholder: "e.g., Your Company LLC",
      bankNameLabel: "Bank Name",
      bankNamePlaceholder: "e.g., Bank of America",
      bankBranchLabel: "Branch",
      bankBranchPlaceholder: "e.g., Main Branch",
      bankAccountNumberLabel: "Account Number",
      bankAccountNumberPlaceholder: "e.g., 123456789"
      saveInfo: "Save Business Info",
      infoSaved: "Business Info Saved!",
      backToSettings: "Back to Settings",
      applyToInvoices: "Apply to Active Invoices",
      applyToInvoicesDesc:
        "This will update business details on existing non-finalized invoices. This is a placeholder action.",
      applyToInvoicesConfirm:
        "This action is a placeholder. In a real scenario, it would update existing invoices. Proceed with mock action?",
    },
    he: {
      title: "פרטי עסק",
      subtitle: "נהל את פרטי החברה שלך עבור חשבוניות ומסמכים רשמיים.",
      businessNameLabel: "שם העסק",
      businessNamePlaceholder: 'לדוגמה, החברה שלך בע"מ',
      businessAddressLabel: "כתובת העסק",
      businessAddressPlaceholder: "לדוגמה, רחוב ראשי 123, עיר, מדינה",
      businessPhoneLabel: "טלפון העסק",
      businessPhonePlaceholder: "לדוגמה, 050-1234567",
      businessVatIdLabel: 'מספר עוסק מורשה / ח"פ',
      businessVatIdPlaceholder: "לדוגמה, 123456789",
      businessEmailLabel: "אימייל העסק", // New
      businessEmailPlaceholder: "לדוגמה, contact@yourcompany.com", // New
      bankAccountNameLabel: "שם חשבון",
      bankAccountNamePlaceholder: 'לדוגמה, החברה שלך בע"מ',
      bankNameLabel: "בנק",
      bankNamePlaceholder: "לדוגמה, בנק לאומי",
      bankBranchLabel: "סניף",
      bankBranchPlaceholder: "לדוגמה, 123",
      bankAccountNumberLabel: "מספר חשבון",
      bankAccountNumberPlaceholder: "לדוגמה, 12-345-678901"
      saveInfo: "שמור פרטי עסק",
      infoSaved: "פרטי העסק נשמרו!",
      backToSettings: "חזור להגדרות",
      applyToInvoices: "החל על חשבוניות פעילות",
      applyToInvoicesDesc: "פעולה זו תעדכן את פרטי העסק בחשבוניות קיימות שאינן סופיות. זוהי פעולת דמה.",
      applyToInvoicesConfirm: "פעולה זו הינה דמה. בתרחיש אמיתי, היא תעדכן חשבוניות קיימות. האם להמשיך בפעולת הדמה?",
    },
  }
  const t = texts[language]

  const handleSave = () => {
    localStorage.setItem(BUSINESS_NAME_KEY, businessName)
    localStorage.setItem(BUSINESS_ADDRESS_KEY, businessAddress)
    localStorage.setItem(BUSINESS_PHONE_KEY, businessPhone)
    localStorage.setItem(BUSINESS_VAT_ID_KEY, businessVatId)
    localStorage.setItem(BUSINESS_EMAIL_KEY, businessEmail)
    
    // Save bank account information
    localStorage.setItem(BANK_ACCOUNT_NAME_KEY, bankAccountName)
    localStorage.setItem(BANK_NAME_KEY, bankName)
    localStorage.setItem(BANK_BRANCH_KEY, bankBranch)
    localStorage.setItem(BANK_ACCOUNT_NUMBER_KEY, bankAccountNumber)
    
    setIsSaved(true)
    setTimeout(() => setIsSaved(false), 3000)
  }

  const handleApplyToInvoices = async () => {
    if (window.confirm(t.applyToInvoicesConfirm)) {
      // Placeholder for actual implementation
      // In a real scenario:
      // 1. Fetch relevant invoices (e.g., status 'draft', 'sent')
      // 2. For each invoice, update its stored business details fields
      //    (This implies Receipt entity needs fields like business_name_snapshot, business_address_snapshot etc.)
      // 3. Save each updated invoice.
      // 4. Provide feedback to the user.
      alert("Mock Action: Business information would be applied to relevant invoices.")
      console.log("Applying to invoices (mock):", {
        businessName,
        businessAddress,
        businessPhone,
        businessVatId,
        businessEmail,
      })
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="p-6 lg:p-8">
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.title}</h1>
              <p className="text-neutral-600">{t.subtitle}</p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl("Settings"))}
              className="border-neutral-300 text-neutral-700 hover:bg-neutral-100"
            >
              <ArrowLeft className={`w-4 h-4 ${isHebrew ? "ml-2" : "mr-2"}`} />
              {t.backToSettings}
            </Button>
          </div>

          <Card className="shadow-lg border-neutral-200">
            <CardHeader className="bg-primary-light/30 border-b border-neutral-200">
              <CardTitle className="flex items-center gap-2 text-primary">
                <Briefcase className="w-5 h-5" /> {t.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <Label htmlFor="businessName" className="font-medium text-neutral-700">
                  {t.businessNameLabel}
                </Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder={t.businessNamePlaceholder}
                  className="mt-1 border-neutral-300 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="businessAddress" className="font-medium text-neutral-700">
                  {t.businessAddressLabel}
                </Label>
                <Input
                  id="businessAddress"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  placeholder={t.businessAddressPlaceholder}
                  className="mt-1 border-neutral-300 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="businessPhone" className="font-medium text-neutral-700">
                  {t.businessPhoneLabel}
                </Label>
                <Input
                  id="businessPhone"
                  type="tel"
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  placeholder={t.businessPhonePlaceholder}
                  className="mt-1 border-neutral-300 focus:border-primary"
                />
              </div>
              <div>
                <Label htmlFor="businessVatId" className="font-medium text-neutral-700">
                  {t.businessVatIdLabel}
                </Label>
                <Input
                  id="businessVatId"
                  value={businessVatId}
                  onChange={(e) => setBusinessVatId(e.target.value)}
                  placeholder={t.businessVatIdPlaceholder}
                  className="mt-1 border-neutral-300 focus:border-primary"
                />
              </div>
              <div>
                {" "}
                {/* New Email Field */}
                <Label htmlFor="businessEmail" className="font-medium text-neutral-700">
                  {t.businessEmailLabel}
                </Label>
                <Input
                  id="businessEmail"
                  type="email"
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  placeholder={t.businessEmailPlaceholder}
                  className="mt-1 border-neutral-300 focus:border-primary"
                />
              </div>
              
              {/* Bank Account Information Section */}
              <div className="pt-6 border-t border-neutral-200">
                <h3 className="text-lg font-semibold text-neutral-800 mb-4">
                  {isHebrew ? "פרטי חשבון בנק" : "Bank Account Information"}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankAccountName" className="font-medium text-neutral-700">
                      {t.bankAccountNameLabel}
                    </Label>
                    <Input
                      id="bankAccountName"
                      value={bankAccountName}
                      onChange={(e) => setBankAccountName(e.target.value)}
                      placeholder={t.bankAccountNamePlaceholder}
                      className="mt-1 border-neutral-300 focus:border-primary"
                      dir={isHebrew ? "rtl" : "ltr"}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bankName" className="font-medium text-neutral-700">
                      {t.bankNameLabel}
                    </Label>
                    <Input
                      id="bankName"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder={t.bankNamePlaceholder}
                      className="mt-1 border-neutral-300 focus:border-primary"
                      dir={isHebrew ? "rtl" : "ltr"}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bankBranch" className="font-medium text-neutral-700">
                      {t.bankBranchLabel}
                    </Label>
                    <Input
                      id="bankBranch"
                      value={bankBranch}
                      onChange={(e) => setBankBranch(e.target.value)}
                      placeholder={t.bankBranchPlaceholder}
                      className="mt-1 border-neutral-300 focus:border-primary"
                      dir={isHebrew ? "rtl" : "ltr"}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="bankAccountNumber" className="font-medium text-neutral-700">
                      {t.bankAccountNumberLabel}
                    </Label>
                    <Input
                      id="bankAccountNumber"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder={t.bankAccountNumberPlaceholder}
                      className="mt-1 border-neutral-300 focus:border-primary"
                      dir={isHebrew ? "rtl" : "ltr"}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t border-neutral-100">
                <div className="flex-1">
                  <Button
                    onClick={handleApplyToInvoices}
                    variant="outline"
                    className="w-full sm:w-auto border-orange-400 text-orange-600 hover:bg-orange-50 flex items-center gap-2 bg-transparent"
                  >
                    <AlertTriangle className="w-4 h-4" /> {t.applyToInvoices}
                  </Button>
                  <p className="text-xs text-neutral-500 mt-1">{t.applyToInvoicesDesc}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isSaved && <p className="text-sm text-green-600 animate-pulse">{t.infoSaved}</p>}
                  <Button onClick={handleSave} className="bg-primary hover:bg-primary-dark text-primary-foreground">
                    <Save className={`w-4 h-4 ${isHebrew ? "ml-2" : "mr-2"}`} />
                    {t.saveInfo}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
