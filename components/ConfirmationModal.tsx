import React from 'react';
import { XMarkIcon } from './icons/XMarkIcon';
import { ExclamationTriangleIcon } from './icons/ExclamationTriangleIcon';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  confirmButtonVariant?: 'danger' | 'primary';
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  confirmText = 'Confirmar',
  confirmButtonVariant = 'primary'
}) => {
  if (!isOpen) return null;

  const confirmButtonClasses = {
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    primary: 'bg-brand-accent hover:bg-brand-accent-hover focus:ring-brand-accent'
  };

  const iconClasses = {
    danger: 'bg-red-900 text-red-400',
    primary: 'bg-blue-900 text-blue-400'
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-brand-secondary rounded-lg shadow-xl w-full max-w-sm p-6 relative">
        <div className="flex items-start">
            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${iconClasses[confirmButtonVariant]}`}>
                <ExclamationTriangleIcon className="h-6 w-6" />
            </div>
            <div className="ml-4 text-left">
                <h3 className="text-lg leading-6 font-medium text-brand-text-primary" id="modal-title">
                    {title}
                </h3>
                <div className="mt-2">
                    <p className="text-sm text-brand-text-secondary">
                    {message}
                    </p>
                </div>
            </div>
        </div>

        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button
                type="button"
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm ${confirmButtonClasses[confirmButtonVariant]}`}
                onClick={() => {
                    onConfirm();
                    onClose();
                }}
            >
                {confirmText}
            </button>
            <button
                type="button"
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-brand-primary text-base font-medium text-brand-text-primary hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-accent sm:mt-0 sm:w-auto sm:text-sm"
                onClick={onClose}
            >
                Cancelar
            </button>
        </div>
      </div>
    </div>
  );
};