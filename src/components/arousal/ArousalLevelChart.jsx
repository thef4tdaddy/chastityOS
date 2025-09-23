import React, { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
} from "chart.js";
import "chartjs-adapter-date-fns";
import dayjs from "dayjs";

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  TimeScale,
  Tooltip,
  Legend,
);

const ArousalLevelChart = ({ arousalLevels, days = 1 }) => {
  const filtered = useMemo(() => {
    const cutoff = dayjs().subtract(days, "day");
    return arousalLevels.filter((a) => dayjs(a.timestamp).isAfter(cutoff));
  }, [arousalLevels, days]);

  const data = {
    labels: filtered.map((a) => a.timestamp),
    datasets: [
      {
        label: "Arousal Level",
        data: filtered.map((a) => a.level),
        fill: false,
        borderColor: "rgb(99,102,241)",
        tension: 0.2,
      },
    ],
  };

  const options = {
    scales: {
      x: {
        type: "time",
        time: { unit: "hour" },
      },
      y: { beginAtZero: true, min: 0, max: 10 },
    },
  };

  return (
    <div className="mb-4">
      <Line data={data} options={options} />
      {filtered.map((a) =>
        a.notes ? (
          <p key={a.id} className="text-sm text-app-text mt-1">
            {dayjs(a.timestamp).format("MMM D, HH:mm")} - {a.notes}
          </p>
        ) : null,
      )}
    </div>
  );
};

export default ArousalLevelChart;
