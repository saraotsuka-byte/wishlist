import { useState } from 'react'
import { Button } from './Button'
import { initEmptyDatabase, initSampleDatabase } from '../db/seed'

interface FirstLaunchModalProps {
  onDone: () => void
}

export function FirstLaunchModal({ onDone }: FirstLaunchModalProps) {
  const [busy, setBusy] = useState(false)

  async function choose(withSample: boolean) {
    setBusy(true)
    try {
      if (withSample) {
        await initSampleDatabase()
      } else {
        await initEmptyDatabase()
      }
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <h2 className="text-lg font-semibold">ようこそ</h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          日用消耗品の在庫と買い物を管理するアプリです。まずはどちらで始めますか？
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <Button onClick={() => choose(true)} disabled={busy}>
            サンプルデータを入れて始める
          </Button>
          <Button variant="secondary" onClick={() => choose(false)} disabled={busy}>
            空の状態で始める
          </Button>
        </div>
      </div>
    </div>
  )
}
