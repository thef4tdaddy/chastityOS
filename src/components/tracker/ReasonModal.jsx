import React from 'react';

const ReasonModal = ({
    isOpen,
    type = 'removal', // 'removal' or 'pause'
    title,
    value,
    onChange,
    onConfirm,
    onCancel,
    placeholder = "Enter reason here (optional)"
}) => {
    if (!isOpen) return null;

    const colors = {
        removal: {
            border: 'border-purple-700',
            title: 'text-purple-300',
            inputBorder: 'border-purple-600',
            inputFocus: 'focus:ring-purple-500',
            confirm: 'bg-purple-600 hover:bg-purple-700'
        },
        pause: {
            border: 'border-yellow-700',
            title: 'text-yellow-300',
            inputBorder: 'border-yellow-600',
            inputFocus: 'focus:ring-yellow-500',
            confirm: 'bg-yellow-600 hover:bg-yellow-700'
        }
    };

    const colorScheme = colors[type];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className={`bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg text-center w-full max-w-md text-gray-50 border ${colorScheme.border}`}>
                <h3 className={`text-lg md:text-xl font-bold mb-4 ${colorScheme.title}`}>
                    {title}
                </h3>
                <textarea 
                    value={value} 
                    onChange={onChange} 
                    placeholder={placeholder} 
                    rows="4"
                    className={`w-full p-2 mb-6 rounded-lg border ${colorScheme.inputBorder} bg-gray-900 text-gray-50 focus:outline-none focus:ring-2 ${colorScheme.inputFocus}`}
                />
                <div className="flex flex-col sm:flex-row justify-around space-y-3 sm:space-y-0 sm:space-x-4">
                    <button 
                        type="button" 
                        onClick={onConfirm} 
                        className={`w-full sm:w-auto ${colorScheme.confirm} text-white font-bold py-2 px-4 rounded-lg transition`}
                    >
                        {type === 'removal' ? 'Confirm Removal' : 'Confirm Pause'}
                    </button>
                    <button 
                        type="button" 
                        onClick={onCancel} 
                        className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ReasonModal;