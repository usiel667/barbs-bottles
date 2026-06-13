type Props = {
  label: string;
  align?: "left" | "right";
};

export function TableHeading({ label, align = "left" }: Props) {
  return (
    <th className={`px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider ${align === "right" ? "text-right" : "text-left"}`}>
      {label}
    </th>
  );
}
