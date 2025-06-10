// src/components/full_report/TotalsSection.jsx
import React from 'react';
import { formatElapsedTime } from '../../utils';

const TotalsSection = ({ totalChastityTime, totalTimeCageOff, overallTotalPauseTime }) => (
    <>
        <h3 className="text-xl font-semibold text-purple-300 mb-2">Totals</h3>
        <div className="mb-1"><strong>Total Effective Time In Chastity:</strong> {formatElapsedTime(totalChastityTime)}</div>
        <div className="mb-1"><strong>Total Time Cage Off:</strong> {formatElapsedTime(totalTimeCageOff)}</div>
        <div className="mb-1"><strong>Overall Total Paused Time (from completed sessions):</strong> <span className="text-yellow-300">{formatElapsedTime(overallTotalPauseTime)}</span></div>
    </>
);

export default TotalsSection;
