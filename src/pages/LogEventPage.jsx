// src/pages/LogEventPage.jsx
import React from 'react';
import LogEventForm from '../components/log_event/LogEventForm';
import EventLogTable from '../components/log_event/EventLogTable';

const LogEventPage = (props) => {
    return (
        <div
            className={`p-0 md:p-4 rounded-lg ${
                import.meta.env.VITE_BUILD_FLAVOR === 'nightly'
                    ? 'bg-nightly-background text-nightly-text border-nightly-border'
                    : 'bg-prod-background text-prod-text border-prod-border'
            }`}
        >
            <LogEventForm {...props} />
            <EventLogTable {...props} />
        </div>
    );
};

export default LogEventPage;