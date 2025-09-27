/**
 * Bottom Sheet Component
 * Mobile-optimized modal that slides up from the bottom
 */
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useViewport } from '../../hooks/mobile/useViewport';
import { useHapticFeedback } from '../../hooks/mobile/useHapticFeedback';
import { useTouchGestures } from '../../hooks/mobile/useTouchGestures';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  maxHeight?: string;
  preventClose?: boolean;
  className?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  children,
  title,
  maxHeight = '80vh',
  preventClose = false,
  className = ''
}) => {
  const { isMobile, safeAreaInsets } = useViewport();
  const { light } = useHapticFeedback();

  // Handle swipe down to close
  const { onTouchStart, onTouchMove, onTouchEnd } = useTouchGestures({
    onSwipeDown: () => {
      if (!preventClose) {
        light();
        onClose();
      }
    }
  }, {
    threshold: 50,
    minDistance: 100
  });

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !preventClose) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, preventClose]);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen, isMobile]);

  if (!isOpen) return null;

  const bottomSheetContent = (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={!preventClose ? onClose : undefined}
        style={{
          paddingBottom: safeAreaInsets.bottom
        }}
      />
      
      {/* Bottom Sheet */}
      <div
        className={`
          relative w-full bg-white dark:bg-gray-900 
          rounded-t-3xl shadow-xl transform transition-transform duration-300 ease-out
          ${isOpen ? 'translate-y-0' : 'translate-y-full'}
          ${className}
        `}
        style={{
          maxHeight,
          paddingBottom: safeAreaInsets.bottom
        }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Handle */}
        <div className="flex justify-center pt-4 pb-2">
          <div className="w-12 h-1 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 pb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h2>
            {!preventClose && (
              <button
                onClick={onClose}
                className="touch-target p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                aria-label="Close"
              >
                <svg
                  className="w-5 h-5 text-gray-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="overflow-auto" style={{ maxHeight: 'calc(80vh - 120px)' }}>
          <div className="px-6 pb-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(bottomSheetContent, document.body);
};

export default BottomSheet;