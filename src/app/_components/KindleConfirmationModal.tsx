'use client';

import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/solid';

interface KindleConfirmationModalProps {
  isOpen: boolean;
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}

export default function KindleConfirmationModal({
  isOpen,
  message,
  type,
  onClose
}: KindleConfirmationModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close after 2 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  useEffect(() => {
    // Handle escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="flex items-start space-x-3">
          {/* Icon */}
          <div className="flex-shrink-0">
            {type === 'success' ? (
              <CheckCircleIcon className="h-6 w-6 text-green-400" />
            ) : (
              <ExclamationCircleIcon className="h-6 w-6 text-red-400" />
            )}
          </div>
          
          {/* Message */}
          <div className="flex-1 pt-0.5">
            <h3 className={`text-sm font-medium ${
              type === 'success' ? 'text-green-200' : 'text-red-200'
            }`}>
              {type === 'success' ? 'Book Sent Successfully' : 'Send Failed'}
            </h3>
            <p className="mt-1 text-sm text-slate-300">
              {message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}