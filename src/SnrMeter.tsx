import React from "react";

interface Props {
  b0: number;
}

const MARKS = [
  { value: 7, label: "7T" },
  { value: 3, label: "3T" },
  { value: 1.5, label: "1.5T" },
  { value: 0, label: "0T" },
];

export const SnrMeter: React.FC<Props> = ({ b0 }) => {
  const pct = Math.min(1, Math.max(0, b0 / 7)) * 100;
  return (
    <div className="snr">
      <span className="snr-label">SNR</span>
      <div className="snr-track">
        <div className="snr-fill" style={{ height: `${pct}%` }} />
        {MARKS.map((m) => (
          <div
            key={m.value}
            className="snr-mark"
            style={{ bottom: `${(m.value / 7) * 100}%` }}
          >
            {m.label}
          </div>
        ))}
      </div>
    </div>
  );
};
