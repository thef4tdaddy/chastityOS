import React, { useMemo } from 'react';
import CalendarHeatmap from 'react-calendar-heatmap';
import 'react-calendar-heatmap/dist/styles.css';
import dayjs from 'dayjs';

const ChastityHeatmap = ({ chastityHistory, sexualEventsLog }) => {
  const endDate = dayjs().endOf('day').toDate();
  const startDate = dayjs(endDate).subtract(180, 'day').toDate();

  const values = useMemo(() => {
    const map = {};

    chastityHistory.forEach(session => {
      const start = dayjs(session.startTime);
      const end = dayjs(session.endTime || new Date());
      for (
        let d = start.startOf('day');
        d.isBefore(end.endOf('day'));
        d = d.add(1, 'day')
      ) {
        const key = d.format('YYYY-MM-DD');
        map[key] = (map[key] || 0) + 1;
      }
    });

    sexualEventsLog.forEach(ev => {
      const ts = ev.eventTimestamp || ev.timestamp;
      if (!ts) return;
      const key = dayjs(ts).format('YYYY-MM-DD');
      map[key] = (map[key] || 0) + 1;
    });

    const arr = [];
    for (
      let d = dayjs(startDate);
      d.isBefore(dayjs(endDate).add(1, 'day'));
      d = d.add(1, 'day')
    ) {
      const key = d.format('YYYY-MM-DD');
      arr.push({ date: key, count: map[key] || 0 });
    }
    return arr;
  }, [chastityHistory, sexualEventsLog, startDate, endDate]);

  return (
    <div className="my-4">
      <CalendarHeatmap
        startDate={startDate}
        endDate={endDate}
        values={values}
        classForValue={value => {
          if (!value || value.count === 0) return 'color-github-0';
          if (value.count >= 4) return 'color-github-4';
          if (value.count >= 3) return 'color-github-3';
          if (value.count >= 2) return 'color-github-2';
          return 'color-github-1';
        }}
        titleForValue={value => {
          if (!value) return '';
          return value.count
            ? `${value.date}: ${value.count} activity`
            : `${value.date}: no activity`;
        }}
        showWeekdayLabels={false}
      />
    </div>
  );
};

export default ChastityHeatmap;
