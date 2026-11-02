import { createContext, useContext, useEffect, type PointerEvent, type ReactNode } from 'react';
import { AnimatePresence, motion, useDragControls } from 'motion/react';
import { CloseIcon } from './Icons';

const SheetDrag = createContext<(e: PointerEvent) => void>(() => {});
/** Panelin içindeki bir alandan (ör. büyük set görseli) aşağı çekip kapatmak için. */
export const useSheetDrag = () => useContext(SheetDrag);

export function Sheet({
  open,
  onClose,
  label,
  children,
}: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
}) {
  const controls = useDragControls();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const h = typeof window === 'undefined' ? 900 : window.innerHeight;
  const startDrag = (e: PointerEvent) => controls.start(e);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="sheet" className="sheet-root">
          <motion.div
            className="scrim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
          />
          <motion.div
            className="sheet"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            initial={{ y: h }}
            animate={{ y: 0 }}
            exit={{ y: h }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.45 }}
            drag="y"
            dragListener={false}
            dragControls={controls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.02, bottom: 0.9 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 550) onClose();
            }}
          >
            <div className="sheet-grab" onPointerDown={startDrag}>
              <i />
            </div>
            <button className="sheet-close tile press" onClick={onClose} aria-label="Kapat">
              <CloseIcon size={18} />
            </button>
            <SheetDrag.Provider value={startDrag}>
              <div className="sheet-scroll">{children}</div>
            </SheetDrag.Provider>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
