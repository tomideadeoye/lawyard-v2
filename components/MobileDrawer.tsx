'use client'

interface MobileDrawerProps {
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

/**
 * Reusable mobile drawer — slide-out panel from the left with backdrop.
 * Consumers control the internal layout (padding, scroll, footer).
 */
export function MobileDrawer({ open, onClose, children }: MobileDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div
        className={`fixed top-0 left-0 bottom-0 w-80 max-w-[85vw] bg-background border-r border-border/50 shadow-2xl z-50 transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {children}
      </div>
    </>
  )
}
