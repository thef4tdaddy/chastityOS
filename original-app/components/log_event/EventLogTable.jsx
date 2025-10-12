// src/components/log_event/EventLogTable.jsx
import React, { useMemo, useState } from "react";
import { formatTime, formatElapsedTime } from "../../utils";
import { EVENT_TYPE_DEFINITIONS } from "../../event_types.js";

const EventLogTable = ({
  isLoadingEvents,
  sexualEventsLog,
  savedSubmissivesName,
  eventDisplayMode,
}) => {
  const formatEventTypesForDisplay = (types, otherDetail, subName) => {
    let displayTypes =
      types && types.length > 0
        ? types
            .map((type) =>
              type === "Orgasm (Self)" && subName
                ? `Orgasm (${subName})`
                : type,
            )
            .join(", ")
        : "";
    if (otherDetail) {
      displayTypes += (displayTypes ? ", " : "") + `Other: ${otherDetail}`;
    }
    return displayTypes || "N/A";
  };
  const formatOrgasmCounts = (selfAmount, partnerAmount) => {
    let parts = [];
    if (selfAmount) parts.push(`Self: ${selfAmount}`);
    if (partnerAmount) parts.push(`Partner: ${partnerAmount}`);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const eventsPerPage = 20;

  // Optimized: Memoize filtering to prevent recalculation on every render
  const filteredSexualEventsLog = useMemo(() => {
    // First, filter out any system-generated logs (like rewards/punishments)
    // by checking for the 'sourceText' property, which only system logs have.
    const manuallyLoggedEvents = sexualEventsLog.filter(
      (event) => !event.sourceText,
    );

    // Then, apply the kinky/vanilla filter to only the manually logged events.
    return manuallyLoggedEvents.filter((event) => {
      if (event.eventType === "startTimeEdit") {
        return true;
      }

      if (eventDisplayMode === "kinky") {
        return true;
      } else {
        const isKinky = (event.types || []).some((type) => {
          const typeDef = EVENT_TYPE_DEFINITIONS.find(
            (def) => def.name === type,
          );
          return typeDef && typeDef.mode === "kinky";
        });
        return !isKinky;
      }
    });
  }, [sexualEventsLog, eventDisplayMode]);

  // Optimized: Memoize pagination to prevent recalculation
  const paginatedEvents = useMemo(() => {
    const startIndex = (currentPage - 1) * eventsPerPage;
    const endIndex = startIndex + eventsPerPage;
    return filteredSexualEventsLog.slice(startIndex, endIndex);
  }, [filteredSexualEventsLog, currentPage]);

  const totalPages = Math.ceil(filteredSexualEventsLog.length / eventsPerPage);

  return (
    <div>
      <h3 className="text-xl font-semibold text-purple-300 mb-3">
        Logged Events
        {filteredSexualEventsLog.length > 0 && (
          <span className="text-sm font-normal text-purple-400 ml-2">
            ({filteredSexualEventsLog.length} total)
          </span>
        )}
      </h3>
      {isLoadingEvents ? (
        <p className="text-purple-200">Loading events...</p>
      ) : filteredSexualEventsLog.length > 0 ? (
        <>
          <div className="overflow-x-auto bg-gray-800 rounded-lg border border-purple-700">
            <table className="min-w-full divide-y divide-purple-700">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">
                    Date & Time
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">
                    Type(s)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">
                    Duration
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">
                    Orgasm Count(s)
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-purple-300 uppercase">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-700">
                {paginatedEvents.map((event) =>
                event.eventType === "startTimeEdit" ? (
                  <tr key={event.id} className="hover:bg-purple-900/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      {formatTime(
                        event.eventTimestamp || event.timestamp,
                        true,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-200">
                      Start Time Edited
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      N/A
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      N/A
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">
                      {event.notes ||
                        `Old: ${event.oldStartTime ? formatTime(new Date(event.oldStartTime), true) : "N/A"} → New: ${event.newStartTime ? formatTime(new Date(event.newStartTime), true) : "N/A"}${event.editedBy ? ` (by ${event.editedBy})` : ""}`}
                    </td>
                  </tr>
                ) : (
                  <tr key={event.id} className="hover:bg-purple-900/20">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      {formatTime(event.eventTimestamp, true)}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">
                      {formatEventTypesForDisplay(
                        event.types,
                        event.otherTypeDetail,
                        savedSubmissivesName,
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      {event.durationSeconds
                        ? formatElapsedTime(event.durationSeconds)
                        : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-purple-200">
                      {formatOrgasmCounts(
                        event.selfOrgasmAmount,
                        event.partnerOrgasmAmount,
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-purple-200 whitespace-pre-wrap break-words max-w-xs">
                      {event.notes}
                    </td>
                  </tr>
                ),
              )}
              </tbody>
            </table>
          </div>

          {/* Pagination controls - only show if more than one page */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-purple-300">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-purple-700 text-white rounded-md hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="text-purple-200">No events logged yet.</p>
      )}
    </div>
  );
};

// Optimized: Wrap with React.memo to prevent re-renders when props don't change
export default React.memo(EventLogTable);
