import React, { useEffect, useRef } from "react";

export interface Proton {
  x: number;
  y: number;
  randomAngle: number;
  seed: number;
}

const RED = { r: 217, g: 117, b: 100 };
const BLUE = { r: 58, g: 135, b: 148 };

function colorForAngle(angle: number): string {
  // -sin(angle) is +1 when pointing up (-π/2), -1 when pointing down (+π/2)
  const uppedness = -Math.sin(angle);
  const t = (uppedness + 1) / 2;
  const r = Math.round(RED.r + (BLUE.r - RED.r) * t);
  const g = Math.round(RED.g + (BLUE.g - RED.g) * t);
  const b = Math.round(RED.b + (BLUE.b - RED.b) * t);
  return `rgb(${r},${g},${b})`;
}

interface Props {
  protons: Proton[];
  alignment: number;
  upProbability: number;
}

export const ProtonVoxel: React.FC<Props> = ({
  protons,
  alignment,
  upProbability,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({ alignment, upProbability, currentAngles: [] as number[] });

  useEffect(() => {
    stateRef.current.alignment = alignment;
    stateRef.current.upProbability = upProbability;
  }, [alignment, upProbability]);

  useEffect(() => {
    stateRef.current.currentAngles = protons.map((p) => p.randomAngle);
  }, [protons]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const lerpAngle = (from: number, to: number, t: number) => {
      let diff = ((to - from + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (diff < -Math.PI) diff += Math.PI * 2;
      return from + diff * t;
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      const { alignment: a, upProbability: up, currentAngles } = stateRef.current;

      ctx.clearRect(0, 0, w, h);

      const inset = 4;
      const innerW = w - inset * 2;
      const innerH = h - inset * 2;

      protons.forEach((p, i) => {
        const targetUp = p.seed < up;
        const idealTarget = targetUp ? -Math.PI / 2 : Math.PI / 2;
        const targetAngle = lerpAngle(p.randomAngle, idealTarget, a);
        const currentAngle = lerpAngle(
          currentAngles[i] ?? p.randomAngle,
          targetAngle,
          0.08
        );
        currentAngles[i] = currentAngle;

        const cx = inset + p.x * innerW;
        const cy = inset + p.y * innerH;
        drawArrow(ctx, cx, cy, currentAngle, colorForAngle(currentAngle));
      });

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [protons]);

  return <canvas ref={canvasRef} className="voxel-canvas" />;
};

function drawArrow(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  angle: number,
  color: string
) {
  const len = 20;
  const head = 8;
  const tailRadius = 5.5;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 2.8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(-len / 2, 0);
  ctx.lineTo(len / 2 - head * 0.5, 0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(len / 2, 0);
  ctx.lineTo(len / 2 - head, -head * 0.6);
  ctx.lineTo(len / 2 - head, head * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(-len / 2, 0, tailRadius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
