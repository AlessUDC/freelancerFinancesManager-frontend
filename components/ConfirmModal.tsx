'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  intent?: 'danger' | 'primary' | 'warning';
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  intent = 'danger',
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const intentStyles = {
    danger: 'bg-red-500 hover:bg-red-600 focus:ring-red-500/30 text-white',
    warning: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500/30 text-white',
    primary: 'bg-[#4e73df] hover:bg-[#2e59d9] focus:ring-[#4e73df]/30 text-white',
  };

  const intentIcon = {
    danger: 'fas fa-exclamation-triangle text-red-500',
    warning: 'fas fa-exclamation-circle text-amber-500',
    primary: 'fas fa-info-circle text-[#4e73df]',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shrink-0">
              <i className={`${intentIcon[intent]} text-lg`} />
            </div>
            <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          </div>
          <p className="text-sm text-gray-500 leading-relaxed pl-13">
            {message}
          </p>
        </div>
        <div className="bg-gray-50 p-4 px-6 flex items-center justify-end gap-3 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 bg-gray-100 rounded-lg transition"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 text-sm font-semibold rounded-lg shadow-sm transition focus:outline-none focus:ring-4 ${intentStyles[intent]}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
