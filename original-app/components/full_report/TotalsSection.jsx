// src/components/full_report/TotalsSection.jsx
import React from "react";
import { formatElapsedTime } from "../../utils";

const TotalsSection = ({
  totalChastityTime,
  totalTimeCageOff,
  overallTotalPauseTime,
  pauseReasonTotals,
}) => (
  <>
    <h3 className="text-xl font-semibold text-purple-300 mb-2">Totals</h3>
    <div className="mb-1">
      <strong>Total Effective Time In Chastity:</strong>{" "}
      {formatElapsedTime(totalChastityTime)}
    </div>
    <div className="mb-1">
      <strong>Total Time Cage Off:</strong>{" "}
      {formatElapsedTime(totalTimeCageOff)}
    </div>
    <div className="mb-1">
      <strong>Overall Total Paused Time (from completed sessions):</strong>{" "}
      <span className="text-yellow-300">
        {formatElapsedTime(overallTotalPauseTime)}
      </span>
    </div>
    {pauseReasonTotals && Object.keys(pauseReasonTotals).length > 0 && (
      <div className="mt-2">
        <strong>Paused Time by Reason:</strong>
        <ul className="list-disc list-inside">
          {Object.entries(pauseReasonTotals).map(([reason, secs]) => (
            <li key={reason}>
              {reason}: {formatElapsedTime(secs)}
            </li>
          ))}
        </ul>
      </div>
    )}
  </>
);

// Optimized: Wrap with React.memo to prevent re-renders when props don't change
export default React.memo(TotalsSection);
