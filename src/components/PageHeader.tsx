import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface PageHeaderProps {
  title: string
  onBack?: boolean
  action?: ReactNode
}

export function PageHeader({ title, onBack = false, action }: PageHeaderProps) {
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex min-h-14 items-center gap-2 border-b border-gray-200 bg-white/95 px-4 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95">
      {onBack && (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="戻る"
          className="-ml-2 flex h-10 w-10 items-center justify-center rounded-full text-xl hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          ←
        </button>
      )}
      <h1 className="flex-1 truncate text-lg font-semibold">{title}</h1>
      {action}
    </header>
  )
}
