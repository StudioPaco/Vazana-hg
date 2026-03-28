"use client"

import { ReactNode, useState } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { StatsContainer } from '@/components/ui/stats-container'
import { LucideIcon, BarChart3 } from 'lucide-react'

export interface StatsItem {
  title: string
  value: string | number
  icon: LucideIcon
  color?: string
  onClick?: () => void
}

interface PageLayoutProps {
  // Page identification
  title: string
  subtitle?: string
  titleIcon?: LucideIcon

  // Navigation
  backHref?: string

  // Stats section
  showStats?: boolean
  statsData?: StatsItem[]

  // Action buttons and filters
  actions?: ReactNode
  filters?: ReactNode

  // Main content
  children: ReactNode

  // Layout variant
  variant?: 'list' | 'form'
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | '7xl' | 'full'
  className?: string
}

function StatsPanel({ statsData }: { statsData: StatsItem[] }) {
  const [expanded, setExpanded] = useState(false)
  if (statsData.length === 0) return null

  return (
    <>
      {expanded && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {statsData.map((stat, index) => (
            <StatsContainer
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color as any}
            />
          ))}
        </div>
      )}
    </>
  )
}

export default function PageLayout({
  title,
  subtitle,
  titleIcon: TitleIcon,
  backHref,
  showStats = false,
  statsData = [],
  actions,
  filters,
  children,
  variant = 'list',
  maxWidth,
  className = ''
}: PageLayoutProps) {
  const [statsExpanded, setStatsExpanded] = useState(false)

  // Default maxWidth based on variant
  const effectiveMaxWidth = maxWidth ?? (variant === 'form' ? '4xl' : 'full')
  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    'full': 'max-w-full'
  }[effectiveMaxWidth]

  const widthClass = effectiveMaxWidth === 'full' ? 'w-full' : `${maxWidthClass} mx-auto`

  return (
    <div className={`${widthClass} ${className}`} dir="rtl">
      {/* Back button row */}
      {backHref && (
        <div className="flex items-center justify-between mb-2">
          <BackButton href={backHref} />
          {/* Stats toggle — icon-only square button */}
          {showStats && statsData.length > 0 && (
            <button
              onClick={() => setStatsExpanded(!statsExpanded)}
              className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg hover:border-gray-400"
              title={statsExpanded ? "הסתר סטטיסטיקות" : "הצג סטטיסטיקות"}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Title row (under back button) */}
      <div className="flex items-center gap-3 mb-6">
        {TitleIcon && (
          <div className="p-2 bg-vazana-teal/10 rounded-lg shrink-0">
            <TitleIcon className="w-6 h-6 text-vazana-teal" />
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 font-hebrew">
            {title}
          </h1>
          {subtitle && (
            <p className="text-gray-600 font-hebrew text-sm mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {/* Stats toggle when no back button */}
        {!backHref && showStats && statsData.length > 0 && (
          <button
            onClick={() => setStatsExpanded(!statsExpanded)}
            className="p-2 text-gray-400 hover:text-gray-900 transition-colors border border-gray-200 rounded-lg hover:border-gray-400"
            title={statsExpanded ? "הסתר סטטיסטיקות" : "הצג סטטיסטיקות"}
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Stats Section — Collapsible */}
      {showStats && statsExpanded && statsData.length > 0 && (
        <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
          {statsData.map((stat, index) => (
            <StatsContainer
              key={index}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color as any}
            />
          ))}
        </div>
      )}

      {/* Actions and Filters Row */}
      {(actions || filters) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {actions}
          </div>
          <div className="flex items-center gap-4">
            {filters}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {children}
      </div>
    </div>
  )
}
