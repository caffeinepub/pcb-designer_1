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
              x2={cx - 7}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 7},${cy - 6} ${cx - 7},${cy + 6} ${cx + 7},${cy}`}
              fill={color}
              opacity={0.7}
            />
            <line
              x1={cx + 7}
              y1={cy - 6}
              x2={cx + 7}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 7}
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
              x2={cx - 7}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <polygon
              points={`${cx - 7},${cy - 6} ${cx - 7},${cy + 6} ${cx + 7},${cy}`}
              fill={color}
              opacity={0.8}
            />
            <line
              x1={cx + 7}
              y1={cy - 6}
              x2={cx + 7}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 7}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 4}
              y1={cy - 8}
              x2={cx + 10}
              y2={cy - 13}
              stroke={color}
              strokeWidth={1}
            />
            <line
              x1={cx + 7}
              y1={cy - 8}
              x2={cx + 13}
              y2={cy - 13}
              stroke={color}
              strokeWidth={1}
            />
          </>
        );
      case "npn":
      case "pnp":
        return (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={10}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 10}
              y1={cy}
              x2={cx - 4}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 4}
              y1={cy - 7}
              x2={cx - 4}
              y2={cy + 7}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 4}
              y1={cy - 4}
              x2={cx + 7}
              y2={cy - 10}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 4}
              y1={cy + 4}
              x2={cx + 7}
              y2={cy + 10}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "vreg":
        return (
          <>
            <rect
              x={cx - 10}
              y={cy - 12}
              width={20}
              height={24}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
            <line
              x1={cx - 10}
              y1={cy - 5}
              x2={cx - 16}
              y2={cy - 5}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx - 10}
              y1={cy + 5}
              x2={cx - 16}
              y2={cy + 5}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 10}
              y1={cy}
              x2={cx + 16}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "crystal":
        return (
          <>
            <line
              x1={cx}
              y1={2}
              x2={cx}
              y2={cy - 8}
              stroke={color}
              strokeWidth={1.5}
            />
            <rect
              x={cx - 6}
              y={cy - 8}
              width={12}
              height={16}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx}
              y1={cy + 8}
              x2={cx}
              y2={size - 2}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      case "ic_dip8":
      case "ic_dip14":
      case "ic_dip16": {
        const pins = item.id === "ic_dip8" ? 4 : item.id === "ic_dip14" ? 5 : 6;
        return (
          <>
            <rect
              x={8}
              y={4}
              width={20}
              height={size - 8}
              fill={color}
              opacity={0.2}
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
            {Array.from({ length: Math.min(pins, 4) }).map((_, i) => {
              const libPinKey = `lib-dip-pin-${String(i)}`;
              return (
                <React.Fragment key={libPinKey}>
                  <line
                    x1={0}
                    y1={6 + i * 7}
                    x2={8}
                    y2={6 + i * 7}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                  <line
                    x1={28}
                    y1={6 + i * 7}
                    x2={36}
                    y2={6 + i * 7}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                </React.Fragment>
              );
            })}
          </>
        );
      }
      case "conn_2pin":
      case "conn_4pin":
      case "conn_8pin": {
        const pins =
          item.id === "conn_2pin" ? 2 : item.id === "conn_4pin" ? 4 : 6;
        const spacing = (size - 8) / (Math.min(pins, 6) - 1);
        return (
          <>
            <rect
              x={8}
              y={4}
              width={20}
              height={size - 8}
              fill="none"
              stroke={color}
              strokeWidth={1.5}
              rx={1}
            />
            {Array.from({ length: Math.min(pins, 6) }).map((_, i) => {
              const libConnKey = `lib-conn-pin-${String(i)}`;
              return (
                <React.Fragment key={libConnKey}>
                  <circle
                    cx={cx}
                    cy={4 + i * spacing}
                    r={2.5}
                    fill={color}
                    opacity={0.8}
                  />
                  <line
                    x1={0}
                    y1={4 + i * spacing}
                    x2={8}
                    y2={4 + i * spacing}
                    stroke={color}
                    strokeWidth={1.5}
                  />
                </React.Fragment>
              );
            })}
          </>
        );
      }
      case "pushbutton":
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
            <line
              x1={cx - 8}
              y1={cy - 6}
              x2={cx - 8}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx + 8}
              y1={cy - 6}
              x2={cx + 8}
              y2={cy + 6}
              stroke={color}
              strokeWidth={2}
            />
            <line
              x1={cx - 8}
              y1={cy - 6}
              x2={cx + 8}
              y2={cy - 6}
              stroke={color}
              strokeWidth={1.5}
              strokeDasharray="2,2"
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
      case "switch":
        return (
          <>
            <line
              x1={2}
              y1={cy}
              x2={cx - 10}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
            <circle cx={cx - 10} cy={cy} r={2.5} fill={color} />
            <circle cx={cx + 10} cy={cy} r={2.5} fill={color} />
            <line
              x1={cx - 7}
              y1={cy}
              x2={cx + 7}
              y2={cy - 8}
              stroke={color}
              strokeWidth={1.5}
            />
            <line
              x1={cx + 10}
              y1={cy}
              x2={size - 2}
              y2={cy}
              stroke={color}
              strokeWidth={1.5}
            />
          </>
        );
      default:
        return (
          <rect
            x={4}
            y={4}
            width={size - 8}
            height={size - 8}
            fill="none"
            stroke={color}
            strokeWidth={1.5}
            rx={2}
          />
        );
    }
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="flex-shrink-0"
      aria-hidden="true"
    >
      {renderSymbol()}
    </svg>
  );
}

export default function ComponentLibrary() {
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
  };

  return (
    <aside
      className="w-56 flex flex-col border-r border-border"
      style={{ background: "oklch(0.16 0.01 160)" }}
    >
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border">
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
                  style={{ color: "oklch(0.55 0.03 160)" }}
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
                          className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-left transition-all ${
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
                              isActive
                                ? "text-amber-DEFAULT font-medium"
                                : "text-foreground/80"
                            }`}
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
