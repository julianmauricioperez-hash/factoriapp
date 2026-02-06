export const COLLECTION_COLORS = [
  { name: "slate", bg: "bg-slate-500", text: "text-slate-500", border: "border-slate-500" },
  { name: "red", bg: "bg-red-500", text: "text-red-500", border: "border-red-500" },
  { name: "orange", bg: "bg-orange-500", text: "text-orange-500", border: "border-orange-500" },
  { name: "amber", bg: "bg-amber-500", text: "text-amber-500", border: "border-amber-500" },
  { name: "yellow", bg: "bg-yellow-500", text: "text-yellow-500", border: "border-yellow-500" },
  { name: "lime", bg: "bg-lime-500", text: "text-lime-500", border: "border-lime-500" },
  { name: "green", bg: "bg-green-500", text: "text-green-500", border: "border-green-500" },
  { name: "emerald", bg: "bg-emerald-500", text: "text-emerald-500", border: "border-emerald-500" },
  { name: "teal", bg: "bg-teal-500", text: "text-teal-500", border: "border-teal-500" },
  { name: "cyan", bg: "bg-cyan-500", text: "text-cyan-500", border: "border-cyan-500" },
  { name: "sky", bg: "bg-sky-500", text: "text-sky-500", border: "border-sky-500" },
  { name: "blue", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500" },
  { name: "indigo", bg: "bg-indigo-500", text: "text-indigo-500", border: "border-indigo-500" },
  { name: "violet", bg: "bg-violet-500", text: "text-violet-500", border: "border-violet-500" },
  { name: "purple", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500" },
  { name: "fuchsia", bg: "bg-fuchsia-500", text: "text-fuchsia-500", border: "border-fuchsia-500" },
  { name: "pink", bg: "bg-pink-500", text: "text-pink-500", border: "border-pink-500" },
  { name: "rose", bg: "bg-rose-500", text: "text-rose-500", border: "border-rose-500" },
] as const;

export type CollectionColor = typeof COLLECTION_COLORS[number]["name"];

export function getColorClasses(colorName: string) {
  const color = COLLECTION_COLORS.find((c) => c.name === colorName);
  return color || COLLECTION_COLORS[0];
}
