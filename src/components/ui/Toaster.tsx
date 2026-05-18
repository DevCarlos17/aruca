import { useState, useEffect } from 'react'
import { X, CheckCircle2, XCircle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { onToast } from '../../lib/toast'

type ToastType = 'success' | 'error' | 'info'
type ToastItem = { id: string; message: string; type: ToastType }

const ICONS = { success: CheckCircle2, error: XCircle, info: Info }

const STYLES: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-900 dark:bg-green-900/30 dark:border-green-700 dark:text-green-100',
  error:   'bg-red-50 border-red-200 text-red-900 dark:bg-red-900/30 dark:border-red-700 dark:text-red-100',
  info:    'bg-blue-50 border-blue-200 text-blue-900 dark:bg-blue-900/30 dark:border-blue-700 dark:text-blue-100',
}

const ICON_STYLES: Record<ToastType, string> = {
  success: 'text-green-600 dark:text-green-400',
  error:   'text-red-600 dark:text-red-400',
  info:    'text-blue-600 dark:text-blue-400',
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  useEffect(() => {
    return onToast((message, type) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`
      setToasts(prev => [...prev, { id, message, type }])
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
    })
  }, [])

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map(t => {
        const Icon = ICONS[t.type]
        return (
          <div
            key={t.id}
            className={cn(
              'flex items-start gap-3 px-4 py-3 rounded-lg border shadow-lg pointer-events-auto',
              STYLES[t.type],
            )}
          >
            <Icon className={cn('w-4 h-4 mt-0.5 shrink-0', ICON_STYLES[t.type])} />
            <p className="text-sm font-medium flex-1 leading-snug">{t.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              className="shrink-0 p-0.5 rounded opacity-60 hover:opacity-100 transition-opacity"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
