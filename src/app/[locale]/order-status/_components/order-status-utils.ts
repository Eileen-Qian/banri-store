/** Shared order-status helpers used across order-status sub-components. */

export const STATUS_BADGES: Record<string, { key: string; badge: string }> = {
  pending: { key: "statusPending", badge: "bg-secondary" },
  confirmed: { key: "statusConfirmed", badge: "bg-info text-dark" },
  payment_sent: { key: "statusVerifying", badge: "bg-warning text-dark" },
  paid: { key: "statusPaid", badge: "bg-success" },
  shipped: { key: "statusShipped", badge: "bg-primary" },
  completed: { key: "statusCompleted", badge: "bg-success" },
  cancelled: { key: "statusCancelled", badge: "bg-danger" },
};

export const CANCELLABLE = ["pending", "confirmed", "payment_sent"];

export function orderStatus(order: { status?: string }) {
  return STATUS_BADGES[order.status ?? "pending"] ?? STATUS_BADGES.pending;
}
