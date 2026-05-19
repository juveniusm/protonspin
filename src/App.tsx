import React, { useMemo, useState } from "react";
import { ProtonVoxel } from "./ProtonVoxel";
import { SnrMeter } from "./SnrMeter";

const B0_MAX = 7;
const PROTON_COUNT = 80;

export const App: React.FC = () => {
  const [b0, setB0] = useState(0);

  const protons = useMemo(() => {
    // Place protons on a jittered grid so arrows never overlap
    const COLS = 12;
    const ROWS = 7;
    const cells: Array<[number, number]> = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) cells.push([c, r]);
    }
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    const chosen = cells.slice(0, PROTON_COUNT);

    // Evenly spaced ranks ensure exactly 40/40 at B0=0 and a deterministic split as B0 rises
    const ranks = Array.from(
      { length: PROTON_COUNT },
      (_, i) => (i + 0.5) / PROTON_COUNT,
    );
    for (let i = ranks.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [ranks[i], ranks[j]] = [ranks[j], ranks[i]];
    }

    return ranks.map((seed, i) => {
      const [c, r] = chosen[i];
      const jitterX = (Math.random() - 0.5) * 0.35;
      const jitterY = (Math.random() - 0.5) * 0.35;
      return {
        x: (c + 0.5 + jitterX) / COLS,
        y: (r + 0.5 + jitterY) / ROWS,
        randomAngle: Math.random() * Math.PI * 2,
        seed,
      };
    });
  }, []);

  const ALIGN_FULL_B0 = 1.5;
  const rotationAlignment = Math.min(1, b0 / ALIGN_FULL_B0);
  const fieldExcess = Math.max(0, (b0 - ALIGN_FULL_B0) / (B0_MAX - ALIGN_FULL_B0));
  const upProbability = 0.5 + 0.35 * fieldExcess;
  const upCount = protons.filter((p) => p.seed < upProbability).length;
  const downCount = PROTON_COUNT - upCount;
  const netExcess = upCount - downCount;
  const m0 = Math.abs(netExcess);
  const snr = b0 / 1.5;

  return (
    <div className="app">
      <header className="header">
        <div className="title-block">
          <h1>MRI Physics: B0 Field Effects</h1>
          <p className="subtitle">
            {b0 === 0
              ? "Increase B0 to align protons and generate a signal."
              : rotationAlignment < 1
              ? "Protons rotate to align with the field axis."
              : fieldExcess < 0.3
              ? "Fully aligned — populations split evenly between parallel and anti-parallel."
              : fieldExcess < 0.7
              ? "Field strength tips the balance — more spins flip to parallel."
              : "Strong field, large parallel excess, high SNR."}
          </p>
        </div>
        <div className="stats">
          <Stat label="Field B0" value={`${b0.toFixed(1)} T`} />
          <Stat label="Parallel (↑)" value={upCount} />
          <Stat label="Anti-parallel (↓)" value={downCount} />
          <Stat label="SNR Ratio" value={`${snr.toFixed(2)}x`} />
        </div>
      </header>

      <main className="main">
        <div className="voxel-wrap">
          <ProtonVoxel
            protons={protons}
            alignment={rotationAlignment}
            upProbability={upProbability}
          />
          <span className="voxel-label">VOXEL OF TISSUE</span>
        </div>
        <aside className="sidebar">
          <div className="m0-readout">
            {m0 < 0.5 ? "M0 = 0 (Net Zero)" : `M0 ≈ ${m0.toFixed(0)} ↑`}
          </div>
          <SnrMeter b0={b0} />
        </aside>
      </main>

      <footer className="controls">
        <label htmlFor="b0-slider">Magnetic Field (B0) [Tesla]</label>
        <input
          id="b0-slider"
          type="range"
          min={0}
          max={B0_MAX}
          step={0.1}
          value={b0}
          onChange={(e) => setB0(Number(e.target.value))}
        />
        <input
          type="number"
          min={0}
          max={B0_MAX}
          step={0.1}
          value={b0}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) setB0(Math.max(0, Math.min(B0_MAX, v)));
          }}
          className="b0-number"
        />
      </footer>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: React.ReactNode }> = ({
  label,
  value,
}) => (
  <div className="stat">
    <div className="stat-label">{label}</div>
    <div className="stat-value">{value}</div>
  </div>
);
