"use client"

import { useState } from "react"
import { DollarSign, Briefcase, Users, CheckCircle, TrendingUp, Calendar, Bell, Plus, FileText } from "lucide-react"
import Link from "next/link"

export default function MainDashboard() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingJobs: 0,
    activeCustomers: 5,
    completedJobs: 0,
  })

  const recentJobs = [
    {
      id: "0006",
      customer: "אדהם עבודות פיתוח",
      location: "תל אביב, לוחמי הגטו",
      date: "13/08/2025",
      status: "פעיל",
      amount: "shift/₪900",
    },
  ]

  const quickActions = [
    { name: "יצירת עבודה חדשה", href: "/jobs/new", icon: Plus, color: "bg-vazana-teal" },
    { name: "הפקת חשבונית", href: "/invoices/new", icon: FileText, color: "bg-vazana-yellow" },
    { name: "ניהול לקוחות", href: "/clients", icon: Users, color: "bg-blue-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-vazana-dark font-hebrew">לוח בקרה</h1>
          <p className="text-gray-600 font-hebrew">ברוכים השבים למערכת ניהול הלקוחות של וזאנה סטודיו</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <button
                className={`${action.color} text-white p-4 rounded-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity font-hebrew w-full`}
              >
                <span>{action.name}</span>
                <action.icon className="w-5 h-5" />
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <DollarSign className="w-8 h-8 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600 font-hebrew">הכנסות החודש</p>
              <p className="text-2xl font-bold text-vazana-dark">₪{stats.totalRevenue.toFixed(2)}</p>
              <p className="text-xs text-gray-500 font-hebrew">מ-₪0.00 ב-</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
            </div>
            <div>
              <p className="text-sm text-gray-600 font-hebrew">עבודות במתנה לתשלום</p>
              <p className="text-2xl font-bold text-vazana-dark">{stats.pendingJobs}</p>
              <p className="text-xs text-gray-500 font-hebrew">מ-במתנה לתשלום</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <Users className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-sm text-gray-600 font-hebrew">לקוחות פעילים</p>
              <p className="text-2xl font-bold text-vazana-dark">{stats.activeCustomers}</p>
              <p className="text-xs text-gray-500 font-hebrew">מ-סך כל הלקוחות</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div className="flex items-center justify-between">
            <div className="w-8 h-8 bg-vazana-teal rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-hebrew">סך כל העבודות</p>
              <p className="text-2xl font-bold text-vazana-dark">{stats.completedJobs}</p>
              <p className="text-xs text-gray-500 font-hebrew">מ-החודש</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Financial Overview */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Bell className="w-5 h-5 text-vazana-teal" />
            <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">סקירה כספית והתראות</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-green-800 font-hebrew">שווי החודש</p>
                <p className="text-xs text-green-600 font-hebrew">₪{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-blue-800 font-hebrew">חשבוניות במיקור</p>
                <p className="text-xs text-blue-600 font-hebrew">0</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <Calendar className="w-5 h-5 text-orange-600" />
              <div className="text-right">
                <p className="text-sm font-semibold text-orange-800 font-hebrew">סך כל הכנסות כל החודשים</p>
                <p className="text-xs text-orange-600 font-hebrew">₪{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <Link href="/jobs" className="text-vazana-teal hover:underline text-sm font-hebrew">
              צפה בכל העבודות
            </Link>
            <h3 className="text-lg font-semibold text-vazana-dark font-hebrew">עבודות אחרונות</h3>
          </div>

          {recentJobs.length > 0 ? (
            <div className="space-y-3">
              {recentJobs.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-hebrew">
                      {job.status}
                    </span>
                    <span className="text-sm text-gray-600 font-hebrew">{job.amount}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-vazana-dark font-hebrew">{job.customer}</p>
                    <p className="text-sm text-gray-600 font-hebrew">{job.location}</p>
                    <p className="text-xs text-gray-500 font-hebrew">{job.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-hebrew">אין עבודות עדיין</p>
              <Link href="/jobs/new">
                <button className="mt-3 bg-vazana-teal text-white px-4 py-2 rounded-lg font-hebrew hover:bg-opacity-90">
                  צור את העבודה הראשונה שלך
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
