"use client"

import { useState, useEffect } from "react"
import { Job, Client, Receipt } from "@/entities/all" // Changed from Invoice to Receipt
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Link } from "react-router-dom"
import { createPageUrl } from "@/utils"
import {
  Briefcase,
  Users,
  FileText, // Can remain for "Generate Invoice" visual
  Plus,
  Calendar,
  DollarSign,
} from "lucide-react"
import { startOfMonth, endOfMonth } from "date-fns"

import StatsCard from "../components/dashboard/StatsCard"
import RecentJobs from "../components/dashboard/RecentJobs"
import FinancialNotificationsPanel from "../components/dashboard/FinancialNotificationsPanel"

export default function Dashboard() {
  const [jobs, setJobs] = useState([])
  const [clients, setClients] = useState([])
  const [receiptsData, setReceiptsData] = useState([]) // Data from Receipt entity
  const [isLoading, setIsLoading] = useState(true)

  const [language, setLanguage] = useState(() => localStorage.getItem("vazana-language") || "he")

  useEffect(() => {
    const handleStorageChange = () => {
      const newLang = localStorage.getItem("vazana-language") || "he"
      if (newLang !== language) {
        setLanguage(newLang)
      }
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
      title: "Dashboard",
      subtitle: "Welcome back to Vazana Studio CRM",
      newJob: "New Job",
      totalJobs: "Total Jobs",
      activeClients: "Active Clients",
      pendingJobs: "Pending Payment",
      monthlyRevenue: "Revenue This Month",
      thisMonth: "this month",
      totalClients: "total clients",
      awaitingPayment: "Awaiting payment",
      total: "total",
      quickActions: "Quick Actions",
      createNewJob: "Create New Job",
      generateInvoice: "Generate Invoice", // Changed
      manageClients: "Manage Clients",
      recentJobsTitle: "Recent Jobs",
    },
    he: {
      title: "לוח בקרה",
      subtitle: "ברוכים השבים למערכת ניהול הלקוחות של וזאנה סטודיו",
      newJob: "עבודה חדשה",
      totalJobs: "סך כל העבודות",
      activeClients: "לקוחות פעילים",
      pendingJobs: "עבודות בהמתנה לתשלום",
      monthlyRevenue: "הכנסות החודש",
      thisMonth: "החודש",
      totalClients: "סך כל הלקוחות",
      awaitingPayment: "בהמתנה לתשלום",
      total: 'סה"כ',
      quickActions: "פעולות מהירות",
      createNewJob: "יצירת עבודה חדשה",
      generateInvoice: "הפקת חשבונית", // Changed
      manageClients: "ניהול לקוחות",
      recentJobsTitle: "עבודות אחרונות",
    },
  }
  const t = texts[language]

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setIsLoading(true)
    try {
      const [jobsData, clientsData, fetchedReceiptsData] = await Promise.all([
        // Changed variable name
        Job.list("-job_date"),
        Client.list("-created_date"),
        Receipt.list("-receipt_date"), // Use Receipt.list()
      ])

      setJobs(jobsData)
      setClients(clientsData)
      setReceiptsData(fetchedReceiptsData) // Store fetched "receipts" (which are invoices)
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
    setIsLoading(false)
  }

  const thisMonthJobs = jobs.filter((job) => {
    const jobDate = new Date(job.job_date)
    const monthStart = startOfMonth(new Date())
    const monthEnd = endOfMonth(new Date())
    return jobDate >= monthStart && jobDate <= monthEnd
  })
  const pendingPaymentJobsCount = jobs.filter((job) => job.payment_status === "pending").length // Assuming "pending" is one of your statuses
  const revenueThisMonth = thisMonthJobs
    .filter((job) => job.payment_status === "paid")
    .reduce((sum, job) => sum + (job.total_amount || 0), 0)
  const totalRevenueAllTime = jobs
    .filter((job) => job.payment_status === "paid")
    .reduce((sum, job) => sum + (job.total_amount || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={`p-6 lg:p-8 w-full ${isHebrew ? "rtl" : "ltr"}`}>
        {/* Header as before */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">{t.title}</h1>
            <p className="text-neutral-600">{t.subtitle}</p>
          </div>
          <Link to={createPageUrl("NewJob")}>
            <Button className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-lg">
              <Plus className={`w-4 h-4 ${isHebrew ? "ms-2" : "me-2"}`} />
              {t.newJob}
            </Button>
          </Link>
        </div>

        {/* Stats Cards as before */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t.totalJobs}
            value={jobs.length}
            icon={Briefcase}
            colorName="primary"
            trend={`${thisMonthJobs.length} ${t.thisMonth}`}
            language={language}
          />
          <StatsCard
            title={t.activeClients}
            value={clients.filter((c) => c.status === "active").length}
            icon={Users}
            colorName="secondary"
            trend={`${clients.length} ${t.totalClients}`}
            language={language}
          />
          <StatsCard
            title={t.pendingJobs}
            value={pendingPaymentJobsCount}
            icon={Calendar}
            colorName="accentPink"
            trend={t.awaitingPayment}
            language={language}
          />
          <StatsCard
            title={t.monthlyRevenue}
            value={`₪${revenueThisMonth.toFixed(2)}`}
            icon={DollarSign}
            colorName="neutral"
            trend={`₪${totalRevenueAllTime.toFixed(2)} ${t.total}`}
            language={language}
          />
        </div>

        {/* Main Content Grid - Pass receiptsData to FinancialNotificationsPanel */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentJobs jobs={jobs.slice(0, 5)} isLoading={isLoading} language={language} title={t.recentJobsTitle} />
          </div>
          <div className="lg:col-span-1">
            <FinancialNotificationsPanel
              jobs={jobs}
              invoices={receiptsData} // Pass the data fetched from Receipt entity as 'invoices'
              clients={clients}
              language={language}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-8">
          <Card className="bg-neutral-100 border-neutral-200">
            <CardHeader>
              <CardTitle className="text-neutral-900">{t.quickActions}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <Link to={createPageUrl("NewJob")}>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-neutral-300 text-neutral-700 hover:bg-neutral-200 bg-transparent"
                  >
                    <Plus className={`w-4 h-4 ${isHebrew ? "ms-2" : "me-2"}`} />
                    {t.createNewJob}
                  </Button>
                </Link>
                <Link to={createPageUrl("GenerateInvoice")}>
                  {" "}
                  {/* Changed from GenerateReceipt */}
                  <Button
                    variant="outline"
                    className="w-full justify-start border-neutral-300 text-neutral-700 hover:bg-neutral-200 bg-transparent"
                  >
                    <FileText className={`w-4 h-4 ${isHebrew ? "ms-2" : "me-2"}`} />
                    {t.generateInvoice} {/* Changed */}
                  </Button>
                </Link>
                <Link to={createPageUrl("Clients")}>
                  <Button
                    variant="outline"
                    className="w-full justify-start border-neutral-300 text-neutral-700 hover:bg-neutral-200 bg-transparent"
                  >
                    <Users className={`w-4 h-4 ${isHebrew ? "ms-2" : "me-2"}`} />
                    {t.manageClients}
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
