import { useLiveQuery } from 'dexie-react-hooks'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { BottomNav } from './components/BottomNav'
import { FirstLaunchModal } from './components/FirstLaunchModal'
import { db } from './db/db'
import { Dashboard } from './pages/Dashboard/Dashboard'
import { ItemDetail } from './pages/Items/ItemDetail'
import { ItemForm } from './pages/Items/ItemForm'
import { ItemList } from './pages/Items/ItemList'
import { ShoppingList } from './pages/ShoppingList/ShoppingList'
import { Settings } from './pages/Settings/Settings'

function App() {
  const categoryCount = useLiveQuery(() => db.categories.count())

  if (categoryCount === undefined) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        読み込み中…
      </div>
    )
  }

  return (
    <HashRouter>
      {categoryCount === 0 && <FirstLaunchModal onDone={() => {}} />}
      <div className="min-h-screen pb-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/items" element={<ItemList />} />
          <Route path="/items/new" element={<ItemForm />} />
          <Route path="/items/:id" element={<ItemDetail />} />
          <Route path="/items/:id/edit" element={<ItemForm />} />
          <Route path="/shopping-list" element={<ShoppingList />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <BottomNav />
    </HashRouter>
  )
}

export default App
