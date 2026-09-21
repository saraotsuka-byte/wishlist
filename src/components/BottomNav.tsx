import { NavLink } from 'react-router-dom'
import { CartIcon, HomeIcon, ListIcon, SettingsIcon } from './icons'

const navItems = [
  { to: '/', label: 'ホーム', icon: HomeIcon, end: true },
  { to: '/items', label: '品目', icon: ListIcon, end: false },
  { to: '/shopping-list', label: '買い物リスト', icon: CartIcon, end: false },
  { to: '/settings', label: '設定', icon: SettingsIcon, end: false },
]

export function BottomNav() {
  return (
    <nav
      aria-label="メインナビゲーション"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-950/95"
    >
      <ul className="mx-auto flex max-w-2xl">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <li key={to} className="flex-1">
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs ${
                  isActive
                    ? 'text-brand font-semibold'
                    : 'text-gray-500 dark:text-gray-400'
                }`
              }
            >
              <Icon className="h-6 w-6" />
              <span>{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
