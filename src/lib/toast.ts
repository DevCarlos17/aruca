// Minimal event-emitter toast system — no external dependencies

type ToastType = 'success' | 'error' | 'info'
type Listener  = (message: string, type: ToastType) => void

const listeners = new Set<Listener>()

function emit(message: string, type: ToastType) {
  listeners.forEach(fn => fn(message, type))
}

export const toast = {
  success: (message: string) => emit(message, 'success'),
  error:   (message: string) => emit(message, 'error'),
  info:    (message: string) => emit(message, 'info'),
}

export function onToast(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
