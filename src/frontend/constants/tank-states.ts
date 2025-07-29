// Define tank states and their colors
export const TANK_STATES = {
  MILKING: {
    color: "#97ff3a",
    text: "MILKING",
    textColor: "text-green-600",
    bgColor: "bg-green-50",
    borderColor: "border-green-200",
  },
  COOLING: {
    color: "#4da1ff",
    text: "COOLING",
    textColor: "text-blue-600",
    bgColor: "bg-blue-50",
    borderColor: "border-blue-200",
  },
  CLEANING: {
    color: "#ff763a",
    text: "CLEANING",
    textColor: "text-orange-600",
    bgColor: "bg-orange-50",
    borderColor: "border-orange-200",
  },
  MAINTENANCE: {
    color: "#f59e0b",
    text: "MAINTENANCE",
    textColor: "text-amber-600",
    bgColor: "bg-amber-50",
    borderColor: "border-amber-200",
  },
  "EMPTY TANK": {
    color: "#bb82ff",
    text: "EMPTY TANK",
    textColor: "text-purple-600",
    bgColor: "bg-purple-50",
    borderColor: "border-purple-200",
  },
  "NO DATA": {
    color: "#9ca3af",
    text: "NO DATA",
    textColor: "text-gray-600",
    bgColor: "bg-gray-50",
    borderColor: "border-gray-200",
  },
};

// Export just the colors for components that only need the color mapping
export const STATE_COLORS = Object.fromEntries(
  Object.entries(TANK_STATES).map(([state, config]) => [state, config.color]),
);