import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronDown, ChevronRight } from "lucide-react";
import React, { useState } from "react";
import { COMPONENT_CATEGORIES } from "../constants/componentLibrary";
import { usePCBCanvas } from "../contexts/PCBCanvasContext";
import type { ComponentLibraryItem } from "../types/pcb";

function ComponentIcon({ item }: { item: ComponentLibraryItem }) {
  const size = 36;
  const cx = size / 2;
  const cy = size / 2;
  const color = item.color;

  const renderSymbol = () => {
    switch (item.id) {
      case "resistor":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 8}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <rect
              x={cx - 8}
              y={cy - 4}
              width={16}
              height={8}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
            <line
              x1={cx + 8}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "capacitor":
        return (
          <>
            <line
              x1={cx}
              y1={2}
              x2={cx}
              y2={cy - 4}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 8}
              y1={cy - 4}
              x2={cx + 8}
              y2={cy - 4}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 8}
              y1={cy + 4}
              x2={cx + 8}
              y2={cy + 4}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx}
              y1={cy + 4}
              x2={cx}
              y2={size - 2}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "inductor":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={8}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <path
              d={`M8,${cy} Q11,${cy - 6} 14,${cy} Q17,${cy - 6} 20,${cy} Q23,${cy - 6} 26,${cy} Q29,${cy - 6} 32,${cy}`}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={32}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "diode":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 6}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 6},${cy - 7} ${cx - 6},${cy + 7} ${cx + 6},${cy}`}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={cx + 6}
              y1={cy - 7}
              x2={cx + 6}
              y2={cy + 7}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 6}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "led":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 6}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 6},${cy - 7} ${cx - 6},${cy + 7} ${cx + 6},${cy}`}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={cx + 6}
              y1={cy - 7}
              x2={cx + 6}
              y2={cy + 7}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 6}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Light rays */}
            <line
              x1={cx + 2}
              y1={cy - 9}
              x2={cx + 6}
              y2={cy - 13}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={cx + 6}
              y1={cy - 8}
              x2={cx + 11}
              y2={cy - 11}
              stroke={color}
              strokeWidth={1}
            />
          </>
        );
      case "zener":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 6}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 6},${cy - 7} ${cx - 6},${cy + 7} ${cx + 6},${cy}`}
              fill={color}
              stroke={color}
              strokeWidth={1}
            />
            {/* Zener bar with bends */}
            <path
              d={`M${cx + 6},${cy - 7} L${cx + 6},${cy + 7} L${cx + 9},${cy + 9} M${cx + 6},${cy - 7} L${cx + 3},${cy - 9}`}
              fill="none"
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 6}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "npn":
        return (
          <>
            {/* Base lead */}
            <line
              x1={2}
              y1={cy}
              x2={cx - 4}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Vertical base line */}
            <line
              x1={cx - 4}
              y1={cy - 9}
              x2={cx - 4}
              y2={cy + 9}
              stroke={color}
              strokeWidth={2}
            />
            {/* Collector lead */}
            <line
              x1={cx - 4}
              y1={cy - 6}
              x2={cx + 6}
              y2={cy - 11}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 6}
              y1={cy - 11}
              x2={cx + 6}
              y2={2}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Emitter lead with arrow */}
            <line
              x1={cx - 4}
              y1={cy + 6}
              x2={cx + 6}
              y2={cy + 11}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Arrow on emitter */}
            <polygon
              points={`${cx + 2},${cy + 8} ${cx + 7},${cy + 13} ${cx + 8},${cy + 7}`}
              fill={color}
            />
            <line
              x1={cx + 6}
              y1={cy + 11}
              x2={cx + 6}
              y2={size - 2}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "pnp":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 4}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 4}
              y1={cy - 9}
              x2={cx - 4}
              y2={cy + 9}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 4}
              y1={cy - 6}
              x2={cx + 6}
              y2={cy - 11}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 6}
              y1={cy - 11}
              x2={cx + 6}
              y2={2}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 4}
              y1={cy + 6}
              x2={cx + 6}
              y2={cy + 11}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Arrow on collector (pointing inward) */}
            <polygon
              points={`${cx},${cy - 8} ${cx - 5},${cy - 9} ${cx - 3},${cy - 4}`}
              fill={color}
            />
            <line
              x1={cx + 6}
              y1={cy + 11}
              x2={cx + 6}
              y2={size - 2}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "mosfet-n":
      case "mosfet-p": {
        const isP = item.id === "mosfet-p";
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 6}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 6}
              y1={cy - 8}
              x2={cx - 6}
              y2={cy + 8}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 2}
              y1={cy - 8}
              x2={cx - 2}
              y2={cy - 2}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 2}
              y1={cy - 5}
              x2={cx + 8}
              y2={cy - 5}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 8}
              y1={cy - 5}
              x2={cx + 8}
              y2={2}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 2}
              y1={cy + 2}
              x2={cx - 2}
              y2={cy + 8}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 2}
              y1={cy + 5}
              x2={cx + 8}
              y2={cy + 5}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 8}
              y1={cy + 5}
              x2={cx + 8}
              y2={size - 2}
              stroke={color}
              strokeWidth={1.5}
            />
            {isP ? (
              <circle cx={cx - 8} cy={cy} r={2} fill={color} />
            ) : (
              <polygon
                points={`${cx - 2},${cy} ${cx + 4},${cy - 4} ${cx + 4},${cy + 4}`}
                fill={color}
              />
            )}
          </>
        );
      }
      case "ne555":
      case "ic-generic": {
        const w = size - 8;
        const h = size - 8;
        return (
          <>
            <rect
              x={4}
              y={4}
              width={w}
              height={h}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={2}
            />
            <text
              x={size / 2}
              y={size / 2 + 4}
              textAnchor="middle"
              fill={color}
              fontSize="8"
              fontFamily="monospace"
            >
              {item.id === "ne555" ? "555" : "IC"}
            </text>
          </>
        );
      }
      case "opamp":
        return (
          <>
            <polygon
              points={`6,${cy - 12} 6,${cy + 12} ${size - 4},${cy}`}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={6}
              y1={cy - 6}
              x2={12}
              y2={cy - 6}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={9}
              y1={cy - 9}
              x2={9}
              y2={cy - 3}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={6}
              y1={cy + 6}
              x2={12}
              y2={cy + 6}
              stroke={color}
              strokeWidth={1}
            />
          </>
        );
      case "crystal":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 7}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 7}
              y1={cy - 6}
              x2={cx - 7}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <rect
              x={cx - 5}
              y={cy - 6}
              width={10}
              height={12}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 5}
              y1={cy - 6}
              x2={cx + 5}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 5}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "potentiometer":
        return (
          <>
            {/* Resistor body */}
            <line
              x1={2}
              y1={cy}
              x2={cx - 8}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <rect
              x={cx - 8}
              y={cy - 4}
              width={16}
              height={8}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
            <line
              x1={cx + 8}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            {/* Arrow wiper */}
            <line
              x1={cx}
              y1={cy - 10}
              x2={cx}
              y2={cy - 4}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 3},${cy - 8} ${cx + 3},${cy - 8} ${cx},${cy - 4}`}
              fill={color}
            />
          </>
        );
      case "screw-terminal":
        return (
          <>
            <rect
              x={cx - 10}
              y={cy - 9}
              width={20}
              height={18}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={2}
            />
            <circle
              cx={cx - 4}
              cy={cy}
              r={3}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <circle
              cx={cx + 4}
              cy={cy}
              r={3}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 4}
              y1={cy - 3}
              x2={cx - 4}
              y2={cy + 3}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={cx + 4}
              y1={cy - 3}
              x2={cx + 4}
              y2={cy + 3}
              stroke={color}
              strokeWidth={1}
            />
          </>
        );
      case "switch":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 8}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <circle cx={cx - 8} cy={cy} r={2} fill={color} />
            <circle cx={cx + 8} cy={cy} r={2} fill={color} />
            <line
              x1={cx - 8}
              y1={cy}
              x2={cx + 6}
              y2={cy - 7}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 8}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      default: {
        const w = size - 8;
        const h = size - 8;
        return (
          <rect
            x={4}
            y={4}
            width={w}
            height={h}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            rx={2}
          />
        );
      }
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      {renderSymbol()}
    </svg>
  );
}

interface ComponentLibraryProps {
  onClose?: () => void;
}

export default function ComponentLibrary({ onClose }: ComponentLibraryProps) {
  const { activeComponentType, setActiveComponentType } = usePCBCanvas();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["Passives", "Semiconductors", "ICs", "Connectors"]),
  );

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    setActiveComponentType(activeComponentType === id ? null : id);
    if (onClose) onClose();
  };

  return (
    <aside
      className="w-56 flex flex-col border-r border-border h-full"
      style={{ background: "oklch(0.16 0.01 160)" }}
    >
      {/* Header - hidden in mobile sheet (sheet provides its own header) */}
      <div className="px-3 py-2.5 border-b border-border hidden md:block">
        <h2 className="text-xs font-semibold tracking-widest uppercase text-muted-foreground font-sans">
          Components
        </h2>
      </div>

      <ScrollArea className="flex-1">
        <div className="py-1">
          {COMPONENT_CATEGORIES.map((category) => {
            const isExpanded = expandedCategories.has(category.name);
            return (
              <div key={category.name}>
                {/* Category header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.name)}
                  className="w-full flex items-center justify-between px-3 py-1.5 text-xs font-semibold tracking-wider uppercase hover:bg-white/5 transition-colors"
                  style={{ color: "oklch(0.65 0.04 160)" }}
                >
                  <span>{category.name}</span>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </button>

                {/* Component items */}
                {isExpanded && (
                  <div className="pb-1">
                    {category.items.map((item) => {
                      const isActive = activeComponentType === item.id;
                      return (
                        <button
                          type="button"
                          key={item.id}
                          onClick={() => handleSelect(item.id)}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 md:py-1.5 text-left transition-all ${
                            isActive
                              ? "bg-amber-DEFAULT/15 border-l-2 border-amber-DEFAULT"
                              : "border-l-2 border-transparent hover:bg-white/5 hover:border-white/20"
                          }`}
                        >
                          <div className="flex-shrink-0 opacity-90">
                            <ComponentIcon item={item} />
                          </div>
                          <span
                            className={`text-xs leading-tight font-mono ${
                              isActive ? "font-medium" : ""
                            }`}
                            style={{
                              color: isActive
                                ? "oklch(0.72 0.16 85)"
                                : "oklch(0.88 0.02 160)",
                            }}
                          >
                            {item.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>

      {/* Footer hint */}
      <div className="px-3 py-2 border-t border-border">
        <p className="text-xs text-muted-foreground/60 leading-tight">
          Click a component to arm placement tool
        </p>
      </div>
    </aside>
  );
}
