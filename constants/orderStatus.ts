export const STATUS_CLASSES: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  design: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  production: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  quality_check: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  shipped: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  canceled: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
};

export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  design: "Design",
  production: "Production",
  quality_check: "Quality Check",
  shipped: "Shipped",
  delivered: "Delivered",
  canceled: "Canceled",
};
