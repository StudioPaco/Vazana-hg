"use client"

import { ReactNode } from 'react'
import { BackButton } from '@/components/ui/back-button'
import { StatsContainer } from '@/components/ui/stats-container'
import { LucideIcon } from 'lucide-react'

interface PageLayoutProps {
  // Page identification
  title: string
  subtitle?: string
  titleIcon?: LucideIcon
  
  // Navigation
  backHref?: string
  showBackButton?: boolean
  
  // Stats section (for pages like jobs, clients, invoices)
  showStats?: boolean
  statsData?: Array<{
    title: string
    value: string | number
    icon: LucideIcon
    color?: string
    onClick?: () => void
  }>
  
  // Action buttons row and filters
  actions?: ReactNode
  filters?: ReactNode
  
  // Main content
  children: ReactNode
  
  // Layout customization
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '6xl' | 'full'
  className?: string
}

export default function PageLayout({
  title,
  subtitle,
  titleIcon: TitleIcon,
  backHref,
  showBackButton = true,
  showStats = false,
  statsData = [],
  actions,
  filters,
  children,
  maxWidth = '6xl',
  className = ''
}: PageLayoutProps) {
  const maxWidthClass = {
    'sm': 'max-w-sm',
    'md': 'max-w-md', 
    'lg': 'max-w-lg',
    'xl': 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl',
    '6xl': 'max-w-6xl',
    'full': 'max-w-full'
  }[maxWidth]

  return (
    <div className={`p-6 pr-4 ${maxWidth === 'full' ? 'w-full' : maxWidthClass + ' mx-auto'} ${className}`} dir="rtl">
      {/* Header Section */}
      <div className={`mb-6 ${showBackButton && backHref ? 'pt-12' : ''} relative`}>
        {/* Back Button - Top row, positioned to right side next to sidebar */}
        {showBackButton && backHref && (
          <div className="absolute -top-10 right-0 mb-4">
            <BackButton href={backHref} />
          </div>
        )}
        
        {/* Page Title Row - Title on right, Icon on left */}
        <div className="flex items-center justify-between">
          {/* Icon on left side */}
          <div className="flex">
            {TitleIcon && <TitleIcon className="w-8 h-8 text-vazana-teal" />}
          </div>
          
          {/* Title and subtitle on right side */}
          <div className="text-right">
            <h1 className="text-2xl font-bold text-gray-900 font-hebrew">
              {title}
            </h1>
            {subtitle && (
              <p className="text-gray-600 font-hebrew mt-1">
                {subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      {showStats && statsData.length > 0 && (
        <div className="mb-6 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
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
        </div>
      )}

      {/* Actions and Filters Row */}
      {(actions || filters) && (
        <div className="mb-6 flex items-center justify-between gap-4">
          {/* Filters on left side */}
          <div className="flex items-center gap-4">
            {filters}
          </div>
          
          {/* Actions on right side */}
          <div className="flex items-center gap-3">
            {actions}
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