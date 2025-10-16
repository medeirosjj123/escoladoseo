import React from 'react';

interface InputFieldProps {
    label: string;
    value: string;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    type?: string;
}

const InputField: React.FC<InputFieldProps> = ({ label, value, onChange, type = 'text' }) => {
    return (
        <div className="mb-4">
            <label className="block text-white text-sm font-bold mb-2" htmlFor={label}>
                {label}
            </label>
            <input
                className="shadow appearance-none border border-gray-600 rounded w-full py-2 px-3 bg-gray-800 text-white leading-tight focus:outline-none focus:shadow-outline"
                id={label}
                type={type}
                value={value}
                onChange={onChange}
            />
        </div>
    );
};

export default InputField;