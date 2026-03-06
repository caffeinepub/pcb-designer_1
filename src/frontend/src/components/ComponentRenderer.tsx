import React from "react";
import { getComponentById } from "../constants/componentLibrary";
import type { PlacedComponent } from "../types/pcb";
import { GRID_SIZE } from "../types/pcb";

interface ComponentRendererProps {
  component: PlacedComponent;
  isSelected: boolean;
  onClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
}

// Renders a schematic-style SVG symbol for each component type
function ComponentSymbol({
  type,
  width,
  height,
  color,
}: { type: string; width: number; height: number; color: string }) {
  const w = width * GRID_SIZE;
  const h = height * GRID_SIZE;
  const cx = w / 2;
  const cy = h / 2;

  const strokeColor = color;
  const strokeW = 1.5;

  switch (type) {
    case "resistor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 12}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <rect
            x={cx - 12}
            y={cy - 6}
            width={24}
            height={12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={1}
          />
          <line
            x1={cx + 12}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            R
          </text>
        </svg>
      );
    case "capacitor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={cx}
            y1={4}
            x2={cx}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 10}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 10}
            y1={cy + 6}
            x2={cx + 10}
            y2={cy + 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx}
            y1={cy + 6}
            x2={cx}
            y2={h - 4}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            C
          </text>
        </svg>
      );
    case "inductor":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={16}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <path
            d={`M16,${cy} Q20,${cy - 8} 24,${cy} Q28,${cy - 8} 32,${cy} Q36,${cy - 8} 40,${cy} Q44,${cy - 8} 48,${cy}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={48}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            L
          </text>
        </svg>
      );
    case "diode":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 10}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <polygon
            points={`${cx - 10},${cy - 8} ${cx - 10},${cy + 8} ${cx + 10},${cy}`}
            fill={strokeColor}
            opacity={0.7}
          />
          <line
            x1={cx + 10}
            y1={cy - 8}
            x2={cx + 10}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx + 10}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            D
          </text>
        </svg>
      );
    case "led":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 10}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <polygon
            points={`${cx - 10},${cy - 8} ${cx - 10},${cy + 8} ${cx + 10},${cy}`}
            fill={strokeColor}
            opacity={0.8}
          />
          <line
            x1={cx + 10}
            y1={cy - 8}
            x2={cx + 10}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx + 10}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx + 6}
            y1={cy - 10}
            x2={cx + 14}
            y2={cy - 16}
            stroke={strokeColor}
            strokeWidth={1}
            markerEnd="url(#arrow)"
          />
          <line
            x1={cx + 10}
            y1={cy - 10}
            x2={cx + 18}
            y2={cy - 16}
            stroke={strokeColor}
            strokeWidth={1}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            LED
          </text>
        </svg>
      );
    case "npn":
    case "pnp":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <circle
            cx={cx}
            cy={cy}
            r={14}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 14}
            y1={cy}
            x2={cx - 6}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 6}
            y1={cy - 10}
            x2={cx - 6}
            y2={cy + 10}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 6}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 14}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 6}
            y1={cy + 6}
            x2={cx + 10}
            y2={cy + 14}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx + 2}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            {type.toUpperCase()}
          </text>
        </svg>
      );
    case "vreg":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={cx - 14}
            y={cy - 18}
            width={28}
            height={36}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          <line
            x1={cx - 14}
            y1={cy - 8}
            x2={cx - 22}
            y2={cy - 8}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 14}
            y1={cy + 8}
            x2={cx - 22}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx + 14}
            y1={cy}
            x2={cx + 22}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            VR
          </text>
        </svg>
      );
    case "crystal":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={cx}
            y1={4}
            x2={cx}
            y2={cy - 14}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <rect
            x={cx - 8}
            y={cy - 14}
            width={16}
            height={28}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 12}
            y1={cy - 10}
            x2={cx - 8}
            y2={cy - 10}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 12}
            y1={cy + 10}
            x2={cx - 8}
            y2={cy + 10}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx}
            y1={cy + 14}
            x2={cx}
            y2={h - 4}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            XTAL
          </text>
        </svg>
      );
    case "ic_dip8":
    case "ic_dip14":
    case "ic_dip16": {
      const pins = type === "ic_dip8" ? 8 : type === "ic_dip14" ? 14 : 16;
      const pinsPerSide = pins / 2;
      const pinSpacing = (h - 16) / (pinsPerSide - 1);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={10}
            y={8}
            width={w - 20}
            height={h - 16}
            fill={strokeColor}
            opacity={0.15}
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          <path
            d={`M${cx - 8},8 Q${cx},14 ${cx + 8},8`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1}
          />
          {Array.from({ length: pinsPerSide }).map((_, i) => {
            const pinKey = `dip-pin-${String(i)}`;
            return (
              <React.Fragment key={pinKey}>
                <line
                  x1={0}
                  y1={8 + i * pinSpacing}
                  x2={10}
                  y2={8 + i * pinSpacing}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                <line
                  x1={w - 10}
                  y1={8 + i * pinSpacing}
                  x2={w}
                  y2={8 + i * pinSpacing}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="9"
            fontFamily="IBM Plex Mono"
            fontWeight="600"
          >
            {type === "ic_dip8"
              ? "DIP8"
              : type === "ic_dip14"
                ? "DIP14"
                : "DIP16"}
          </text>
        </svg>
      );
    }
    case "conn_2pin":
    case "conn_4pin":
    case "conn_8pin": {
      const pins = type === "conn_2pin" ? 2 : type === "conn_4pin" ? 4 : 8;
      const pinSpacing = (h - 8) / (pins - 1);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={6}
            y={4}
            width={w - 12}
            height={h - 8}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          {Array.from({ length: pins }).map((_, i) => {
            const connKey = `conn-pin-${String(i)}`;
            return (
              <React.Fragment key={connKey}>
                <circle
                  cx={cx}
                  cy={4 + i * pinSpacing}
                  r={3}
                  fill={strokeColor}
                  opacity={0.8}
                />
                <line
                  x1={0}
                  y1={4 + i * pinSpacing}
                  x2={6}
                  y2={4 + i * pinSpacing}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
          <text
            x={cx + 6}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            J{pins}
          </text>
        </svg>
      );
    }
    case "pushbutton":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 12}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 12}
            y1={cy - 8}
            x2={cx - 12}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx + 12}
            y1={cy - 8}
            x2={cx + 12}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 12}
            y1={cy - 8}
            x2={cx + 12}
            y2={cy - 8}
            stroke={strokeColor}
            strokeWidth={strokeW}
            strokeDasharray="3,2"
          />
          <line
            x1={cx + 12}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            SW
          </text>
        </svg>
      );
    case "switch":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 16}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <circle cx={cx - 16} cy={cy} r={3} fill={strokeColor} />
          <circle cx={cx + 16} cy={cy} r={3} fill={strokeColor} />
          <line
            x1={cx - 13}
            y1={cy}
            x2={cx + 10}
            y2={cy - 10}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx + 16}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            SW
          </text>
        </svg>
      );

    // --- Tesla Coil components ---

    case "ne555": {
      const pinsPerSide = 4;
      const pinSpacing = (h - 16) / (pinsPerSide - 1);
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={10}
            y={8}
            width={w - 20}
            height={h - 16}
            fill={strokeColor}
            opacity={0.15}
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          <path
            d={`M${cx - 8},8 Q${cx},14 ${cx + 8},8`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1}
          />
          {Array.from({ length: pinsPerSide }).map((_, i) => {
            const ne555Key = `ne555-pin-${String(i)}`;
            return (
              <React.Fragment key={ne555Key}>
                <line
                  x1={0}
                  y1={8 + i * pinSpacing}
                  x2={10}
                  y2={8 + i * pinSpacing}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
                <line
                  x1={w - 10}
                  y1={8 + i * pinSpacing}
                  x2={w}
                  y2={8 + i * pinSpacing}
                  stroke={strokeColor}
                  strokeWidth={1.5}
                />
              </React.Fragment>
            );
          })}
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
            fontWeight="600"
          >
            NE555
          </text>
        </svg>
      );
    }

    case "cap_ceramic_100nf":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={cx}
            y1={4}
            x2={cx}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 10}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 10}
            y1={cy + 6}
            x2={cx + 10}
            y2={cy + 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx}
            y1={cy + 6}
            x2={cx}
            y2={h - 4}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            100nF
          </text>
        </svg>
      );

    case "cap_ceramic_10nf":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={cx}
            y1={4}
            x2={cx}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 10}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 10}
            y1={cy + 6}
            x2={cx + 10}
            y2={cy + 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx}
            y1={cy + 6}
            x2={cx}
            y2={h - 4}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            10nF
          </text>
        </svg>
      );

    case "cap_elec_100uf":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={cx}
            y1={4}
            x2={cx}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          {/* Positive plate (straight line) */}
          <line
            x1={cx - 10}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 6}
            stroke={strokeColor}
            strokeWidth={2}
          />
          {/* Negative plate (curved arc) */}
          <path
            d={`M${cx - 10},${cy + 6} Q${cx},${cy + 2} ${cx + 10},${cy + 6}`}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx}
            y1={cy + 6}
            x2={cx}
            y2={h - 4}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          {/* + polarity marker */}
          <text
            x={cx + 12}
            y={cy - 4}
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            +
          </text>
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            100µF
          </text>
        </svg>
      );

    case "pot_p1":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          {/* Lead lines */}
          <line
            x1={4}
            y1={cy}
            x2={cx - 12}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <rect
            x={cx - 12}
            y={cy - 6}
            width={24}
            height={12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={1}
          />
          <line
            x1={cx + 12}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          {/* Diagonal arrow through resistor body */}
          <line
            x1={cx - 8}
            y1={cy + 5}
            x2={cx + 8}
            y2={cy - 5}
            stroke={strokeColor}
            strokeWidth={1.2}
          />
          {/* Arrowhead */}
          <polygon
            points={`${cx + 8},${cy - 5} ${cx + 3},${cy - 5} ${cx + 8},${cy}`}
            fill={strokeColor}
          />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            P1
          </text>
        </svg>
      );

    case "pot_p2":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 12}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <rect
            x={cx - 12}
            y={cy - 6}
            width={24}
            height={12}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={1}
          />
          <line
            x1={cx + 12}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 8}
            y1={cy + 5}
            x2={cx + 8}
            y2={cy - 5}
            stroke={strokeColor}
            strokeWidth={1.2}
          />
          <polygon
            points={`${cx + 8},${cy - 5} ${cx + 3},${cy - 5} ${cx + 8},${cy}`}
            fill={strokeColor}
          />
          <text
            x={cx}
            y={cy - 10}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            P2
          </text>
        </svg>
      );

    case "npn_power":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <circle
            cx={cx}
            cy={cy}
            r={14}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 14}
            y1={cy}
            x2={cx - 6}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 6}
            y1={cy - 10}
            x2={cx - 6}
            y2={cy + 10}
            stroke={strokeColor}
            strokeWidth={2}
          />
          <line
            x1={cx - 6}
            y1={cy - 6}
            x2={cx + 10}
            y2={cy - 14}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx - 6}
            y1={cy + 6}
            x2={cx + 10}
            y2={cy + 14}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx + 2}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            Q1
          </text>
        </svg>
      );

    case "screw_term_2pin":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={6}
            y={4}
            width={w - 12}
            height={h - 8}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          {/* Two screw-head circles */}
          <circle
            cx={cx}
            cy={cy - 8}
            r={5}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          <line
            x1={cx - 3}
            y1={cy - 8}
            x2={cx + 3}
            y2={cy - 8}
            stroke={strokeColor}
            strokeWidth={1}
          />
          <circle
            cx={cx}
            cy={cy + 8}
            r={5}
            fill="none"
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          <line
            x1={cx - 3}
            y1={cy + 8}
            x2={cx + 3}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={1}
          />
          {/* Lead lines */}
          <line
            x1={0}
            y1={cy - 8}
            x2={6}
            y2={cy - 8}
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          <line
            x1={0}
            y1={cy + 8}
            x2={6}
            y2={cy + 8}
            stroke={strokeColor}
            strokeWidth={1.5}
          />
          <text
            x={cx + 8}
            y={cy + 3}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="7"
            fontFamily="IBM Plex Mono"
          >
            T
          </text>
        </svg>
      );

    case "switch_spst":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 16}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <circle cx={cx - 16} cy={cy} r={3} fill={strokeColor} />
          <circle cx={cx + 16} cy={cy} r={3} fill={strokeColor} />
          <line
            x1={cx - 13}
            y1={cy}
            x2={cx + 10}
            y2={cy - 10}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx + 16}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            S1
          </text>
        </svg>
      );

    case "switch_timer":
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <line
            x1={4}
            y1={cy}
            x2={cx - 16}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <circle cx={cx - 16} cy={cy} r={3} fill={strokeColor} />
          <circle cx={cx + 16} cy={cy} r={3} fill={strokeColor} />
          <line
            x1={cx - 13}
            y1={cy}
            x2={cx + 10}
            y2={cy - 10}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <line
            x1={cx + 16}
            y1={cy}
            x2={w - 4}
            y2={cy}
            stroke={strokeColor}
            strokeWidth={strokeW}
          />
          <text
            x={cx}
            y={cy - 14}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="8"
            fontFamily="IBM Plex Mono"
          >
            S2
          </text>
        </svg>
      );

    default:
      return (
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
          <rect
            x={4}
            y={4}
            width={w - 8}
            height={h - 8}
            fill="none"
            stroke={strokeColor}
            strokeWidth={strokeW}
            rx={2}
          />
          <text
            x={cx}
            y={cy + 4}
            textAnchor="middle"
            fill={strokeColor}
            fontSize="9"
            fontFamily="IBM Plex Mono"
          >
            {type}
          </text>
        </svg>
      );
  }
}

export default function ComponentRenderer({
  component,
  isSelected,
  onClick,
  onMouseDown,
}: ComponentRendererProps) {
  const libItem = getComponentById(component.componentType);
  if (!libItem) return null;

  const w = libItem.width * GRID_SIZE;
  const h = libItem.height * GRID_SIZE;

  // For rotation, swap width/height for 90/270
  const isRotated90or270 =
    component.rotation === 90 || component.rotation === 270;
  const displayW = isRotated90or270 ? h : w;
  const displayH = isRotated90or270 ? w : h;

  const x = component.position.x * GRID_SIZE;
  const y = component.position.y * GRID_SIZE;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ")
          onClick(e as unknown as React.MouseEvent);
      }}
      style={{ cursor: "pointer" }}
    >
      {/* Selection highlight */}
      {isSelected && (
        <rect
          x={-3}
          y={-3}
          width={displayW + 6}
          height={displayH + 6}
          fill="none"
          stroke="#f5a623"
          strokeWidth={2}
          strokeDasharray="4,2"
          rx={2}
        />
      )}
      {/* Component body with rotation */}
      <g
        transform={`rotate(${component.rotation}, ${displayW / 2}, ${displayH / 2})`}
      >
        <ComponentSymbol
          type={component.componentType}
          width={libItem.width}
          height={libItem.height}
          color={libItem.color}
        />
      </g>
      {/* Component label */}
      <text
        x={displayW / 2}
        y={displayH + 10}
        textAnchor="middle"
        fill="rgba(255,255,255,0.5)"
        fontSize="7"
        fontFamily="IBM Plex Mono"
      >
        {component.name}
      </text>
    </g>
  );
}
