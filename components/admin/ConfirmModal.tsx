import React from 'react';
import Modal from '../Modal';

interface ConfirmModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirmar", cancelText = "Cancelar" }) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div>
                <div className="text-gray-300">{message}</div>
                <div className="flex justify-end mt-6">
                    <button onClick={onClose} className="mr-4 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded-md">
                        {cancelText}
                    </button>
                    <button onClick={onConfirm} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded-md">
                        {confirmText}
                    </button>
                </div>
            </div>
        </Modal>
    );
};

export default ConfirmModal;
