"use client"

import { useState } from "react"
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
    { name: "יצירת עבודה חדשה", href: "/jobs/new", color: "bg-teal-500" },
    { name: "הפקת חשבונית", href: "/invoices/new", color: "bg-yellow-500" },
    { name: "ניהול לקוחות", href: "/clients", color: "bg-blue-500" },
    { name: "בדיקת מסד נתונים", href: "/debug", color: "bg-purple-500" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-right space-y-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">לוח בקרה</h1>
          <p className="text-gray-600">ברוכים השבים למערכת ניהול הלקוחות של וזאנה סטודיו</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Link key={action.name} href={action.href}>
              <button
                className={`${action.color} text-white p-4 rounded-lg flex items-center justify-center gap-3 hover:opacity-90 transition-opacity w-full`}
              >
                <span>{action.name}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div>
            <p className="text-sm text-gray-600">הכנסות החודש</p>
            <p className="text-2xl font-bold text-gray-900">₪{stats.totalRevenue.toFixed(2)}</p>
            <p className="text-xs text-gray-500">מ-₪0.00 ב-</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div>
            <p className="text-sm text-gray-600">עבודות במתנה לתשלום</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingJobs}</p>
            <p className="text-xs text-gray-500">מ-במתנה לתשלום</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div>
            <p className="text-sm text-gray-600">לקוחות פעילים</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeCustomers}</p>
            <p className="text-xs text-gray-500">מ-סך כל הלקוחות</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200 text-right">
          <div>
            <p className="text-sm text-gray-600">סך כל העבודות</p>
            <p className="text-2xl font-bold text-gray-900">{stats.completedJobs}</p>
            <p className="text-xs text-gray-500">מ-החודש</p>
          </div>
        </div>
      </div>

      {/* Recent Jobs */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <Link href="/jobs" className="text-teal-600 hover:underline text-sm">
            צפה בכל העבודות
          </Link>
          <h3 className="text-lg font-semibold text-gray-900">עבודות אחרונות</h3>
        </div>

        {recentJobs.length > 0 ? (
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">{job.status}</span>
                  <span className="text-sm text-gray-600">{job.amount}</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">{job.customer}</p>
                  <p className="text-sm text-gray-600">{job.location}</p>
                  <p className="text-xs text-gray-500">{job.date}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">אין עבודות עדיין</p>
            <Link href="/jobs/new">
              <button className="mt-3 bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700">
                צור את העבודה הראשונה שלך
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
