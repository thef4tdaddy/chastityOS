// src/components/full_report/SessionEventLogSection.jsx
import React from "react";
import { formatTime } from "../../utils";

const SessionEventLogSection = ({ isLoadingEvents, eventLog }) => {
  const filteredLog = eventLog.filter(
    (event) => event.eventType === "startTimeEdit",
  );

  if (isLoadingEvents) {
    return (
      <p className="text-orange-200 text-center">Loading session events...</p>
    );
  }

  if (filteredLog.length === 0) {
    return (
      <p className="text-orange-200 text-center">
        No session events logged yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto bg-gray-800 rounded-lg border border-orange-700 mt-6">
      <table className="min-w-full divide-y divide-orange-700">
        <thead className="bg-gray-700">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-orange-300 uppercase">
              Date & Time
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-orange-300 uppercase">
              Event Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-orange-300 uppercase">
              Old Start Time
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-orange-300 uppercase">
              New Start Time
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-orange-300 uppercase">
              Edited By
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-orange-700">
          {filteredLog.map((event) => (
            <tr key={event.id} className="hover:bg-orange-900/20">
              <td className="px-4 py-3 whitespace-nowrap text-sm text-orange-200">
                {event.timestamp?.toDate
                  ? formatTime(event.timestamp.toDate(), true)
                  : "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-orange-200">
                Start Time Edited
              </td>
              <td className="px-4 py-3 text-sm text-orange-200">
                {event.oldStartTime
                  ? formatTime(new Date(event.oldStartTime), true)
                  : "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-orange-200">
                {event.newStartTime
                  ? formatTime(new Date(event.newStartTime), true)
                  : "N/A"}
              </td>
              <td className="px-4 py-3 text-sm text-orange-200">
                {event.editedBy || "N/A"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SessionEventLogSection;
