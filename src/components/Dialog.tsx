import { X } from 'lucide-react'
import { type ReactNode, useEffect, useRef } from 'react'

interface DialogProps {
  title: string
  children: ReactNode
  onClose: () => void
  wide?: boolean
  className?: string
  backdropClassName?: string
}

export function Dialog({ title, children, onClose, wide = false, className = '', backdropClassName = '' }: DialogProps) {
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeButton.current?.focus()
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div className={`dialog-backdrop ${backdropClassName}`} role="presentation" onMouseDown={onClose}>
      <section
        aria-label={title}
        aria-modal="true"
        className={`dialog ${wide ? 'dialog--wide' : ''} ${className}`}
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog__header">
          <h2>{title}</h2>
          <button ref={closeButton} aria-label="Cerrar" className="icon-button" type="button" onClick={onClose}>
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}
