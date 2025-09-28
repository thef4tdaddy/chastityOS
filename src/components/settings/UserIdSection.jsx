import React from 'react';

const UserIdSection = ({
    isAuthReady,
    showUserIdInSettings,
    handleToggleUserIdVisibility,
    userId
}) => {
    return (
        <>
            <hr className="my-4 border-purple-600" />
            <h4 className="text-lg font-medium text-purple-200 mb-2 text-left">Anonymous Account ID</h4>
            <button
                type="button"
                onClick={handleToggleUserIdVisibility}
                disabled={!isAuthReady}
                className="w-full sm:w-auto bg-slate-600 hover:bg-slate-700 text-white text-sm py-2 px-4 rounded-lg shadow-md transition duration-300 disabled:opacity-50 mb-3"
            >
                {showUserIdInSettings ? 'Hide User ID' : 'Show User ID'}
            </button>
            {showUserIdInSettings && userId && (
                <div className="p-3 bg-gray-700 rounded-md text-left">
                    <p className="text-sm text-purple-300">
                        Your Anonymous User ID: <span className="font-mono text-purple-100 select-all">{userId}</span>
                    </p>
                </div>
            )}
        </>
    );
};

export default UserIdSection;