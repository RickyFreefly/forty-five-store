// Shared animation tokens — keeps timings consistent across the app (spec §7).
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const DURATION = {
  hover: 0.18,
  select: 0.4,
  panel: 0.3,
  sectionIn: 0.5,
  rackSettle: 0.45,
  accordion: 0.3,
  genderSwitch: 0.18,
};

export const SPRING_SETTLE = { type: "spring" as const, stiffness: 280, damping: 32, mass: 0.6 };
export const SPRING_PANEL = { type: "spring" as const, stiffness: 240, damping: 26 };
