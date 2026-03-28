"use client"

import { useState, useEffect } from "react"
import JobsPage from "@/components/jobs/jobs-page"
import PageLayout from "@/components/layout/page-layout"
import type { StatsItem } from "@/components/layout/page-layout"
import { Briefcase, DollarSign, Clock, AlertTriangle, CheckCircle, Upload, Grid3X3, List, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function Jobs() {
  return (
    <PageLayout
      title="עבודות"
      subtitle="נהל את כל העבודות והשירותים והפרויקטים שלך"
      titleIcon={Briefcase}
      backHref="/"
      variant="list"
      showStats={false}
    >
      <JobsPage showHeader={false} />
    </PageLayout>
  )
}
