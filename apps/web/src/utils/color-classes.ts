/**
 * Color to Tailwind class mapping for car colors
 * This ensures Tailwind can detect and include the classes in the build
 */
export const getColorClass = (color: string): string => {
  const colorLower = color.toLowerCase();
  
  // Map common car colors to Tailwind classes
  const colorMap: Record<string, string> = {
    red: "text-red-400",
    blue: "text-blue-400",
    green: "text-green-400",
    yellow: "text-yellow-400",
    orange: "text-orange-400",
    purple: "text-purple-400",
    pink: "text-pink-400",
    black: "text-slate-400",
    white: "text-slate-300",
    silver: "text-slate-300",
    gray: "text-slate-400",
    grey: "text-slate-400",
    brown: "text-amber-600",
    beige: "text-amber-200",
    gold: "text-yellow-500",
    bronze: "text-orange-600",
    navy: "text-blue-600",
    maroon: "text-red-700",
    teal: "text-teal-400",
    cyan: "text-cyan-400",
    indigo: "text-indigo-400",
    violet: "text-violet-400",
    lime: "text-lime-400",
    emerald: "text-emerald-400",
    sky: "text-sky-400",
    fuchsia: "text-fuchsia-400",
    rose: "text-rose-400",
  };

  return colorMap[colorLower] || "text-slate-400";
};
