import type { ReactNode } from 'react'

type Tone = 'danger' | 'warning' | 'success' | 'neutral'

const toneClasses: Record<Tone, string> = {
  danger: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  warning: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  success: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  neutral: 'bg-[#AFE9E9] text-gray-800 dark:bg-gray-800 dark:text-[#74D8D8]',
}

interface BadgeProps {
  tone: Tone
  icon?: ReactNode
  children: ReactNode
}

export function Badge({ tone, icon, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}
    >
      {icon}
      {children}
    </span>
  )
}
