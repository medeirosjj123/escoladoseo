import React from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black bg-opacity-75 z-50 flex justify-center items-start pt-16 md:pt-24"
            onClick={onClose}
        >
            <div 
                className="bg-[#181818] rounded-lg shadow-xl w-full max-w-2xl m-4 animate-fade-in-down"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <div className="flex justify-between items-center p-5 border-b border-gray-700">
                    <h3 className="text-xl font-bold text-white">{title}</h3>
                    <button 
                        onClick={onClose} 
                        className="text-gray-400 hover:text-white text-3xl leading-none font-semibold outline-none focus:outline-none"
                    >
                        &times;
                    </button>
                </div>
                <div className="p-6 pb-6 text-white max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default Modal;
