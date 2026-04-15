export const formatInr = (value: number | string) => {
  const numericValue = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

export const orderStatusToLabel = (status: string) =>
  status
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

export const orderStatusToColor = (status: string) => {
  const palette: Record<string, string> = {
    QUOTATION: "gray",
    QUOTATION_RECEIVED: "indigo",
    PACKING: "blue",
    DISPATCHED: "green",
    PAID: "green",
    UNPAID: "orange",
    COMPLETED: "green",
    CANCELLED: "red"
  };

  return palette[status] ?? "gray";
};

export const manufacturingStatusToColor = (status: string) => {
  const palette: Record<string, string> = {
    IN_PROGRESS: "orange",
    COMPLETED: "green",
    CANCELLED: "red"
  };

  return palette[status] ?? "gray";
};

export const nextActionsForOrder = (status: string, type: "SALE" | "PURCHASE") => {
  if (status === "CANCELLED" || status === "COMPLETED") {
    return [] as string[];
  }

  if (type === "SALE") {
    if (status === "QUOTATION") return ["PACKING", "CANCELLED"];
    if (status === "PACKING") return ["DISPATCHED", "CANCELLED"];
    if (status === "DISPATCHED") return ["COMPLETED"];
    return ["CANCELLED"];
  }

  if (status === "QUOTATION_RECEIVED") return ["PAID", "UNPAID", "CANCELLED"];
  if (status === "PAID" || status === "UNPAID") return ["COMPLETED", "CANCELLED"];
  return ["CANCELLED"];
};
