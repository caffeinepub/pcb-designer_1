import type { PlacedComponent } from "../types/pcb";

export const TESLA_COIL_TEMPLATE: {
  name: string;
  components: PlacedComponent[];
} = {
  name: "Tesla Coil (12V)",
  components: [
    // Power input screw terminal (left side)
    {
      id: 1,
      name: "PWR IN",
      componentType: "screw_term_2pin",
      position: { x: 2, y: 5 },
      rotation: 0,
    },
    // HV module screw terminal (right side)
    {
      id: 2,
      name: "HV OUT",
      componentType: "screw_term_2pin",
      position: { x: 22, y: 5 },
      rotation: 0,
    },
    // NE555 timer IC (center)
    {
      id: 3,
      name: "NE555",
      componentType: "ne555",
      position: { x: 8, y: 6 },
      rotation: 0,
    },
    // Decoupling cap 100nF (near pin 8 of NE555)
    {
      id: 4,
      name: "C1 100nF",
      componentType: "cap_ceramic_100nf",
      position: { x: 8, y: 2 },
      rotation: 0,
    },
    // Decoupling cap 10nF (near pin 5 of NE555)
    {
      id: 5,
      name: "C2 10nF",
      componentType: "cap_ceramic_10nf",
      position: { x: 12, y: 2 },
      rotation: 0,
    },
    // Potentiometer P1 ON-time (below NE555 left)
    {
      id: 6,
      name: "P1 ON",
      componentType: "pot_p1",
      position: { x: 7, y: 14 },
      rotation: 0,
    },
    // Potentiometer P2 OFF-time (below NE555 right)
    {
      id: 7,
      name: "P2 OFF",
      componentType: "pot_p2",
      position: { x: 11, y: 14 },
      rotation: 0,
    },
    // Timing capacitor 100µF
    {
      id: 8,
      name: "CT 100µF",
      componentType: "cap_elec_100uf",
      position: { x: 15, y: 13 },
      rotation: 0,
    },
    // NPN power transistor Q1 (right side)
    {
      id: 9,
      name: "Q1",
      componentType: "npn_power",
      position: { x: 19, y: 6 },
      rotation: 0,
    },
    // Main power switch S1 (left side)
    {
      id: 10,
      name: "S1 PWR",
      componentType: "switch_spst",
      position: { x: 2, y: 12 },
      rotation: 0,
    },
    // Timer switch S2 (left side below S1)
    {
      id: 11,
      name: "S2 TMR",
      componentType: "switch_timer",
      position: { x: 2, y: 17 },
      rotation: 0,
    },
  ],
};
