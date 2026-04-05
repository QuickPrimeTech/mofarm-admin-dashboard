"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  ArrowUpRight,
  CreditCard,
  Loader2,
  TrendingUp,
  Wallet,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Edit2,
} from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  order_id: string;
  amount: number;
  payment_method?: string | null;
  status: string;
  mpesa_request_id?: string;
  created_at: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  completed: {
    label: "Completed",
    icon: <CheckCircle2 size={12} />,
    variant: "default",
    className:
      "bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100",
  },
  pending: {
    label: "Pending",
    icon: <Clock size={12} />,
    variant: "secondary",
    className:
      "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100",
  },
  failed: {
    label: "Failed",
    icon: <XCircle size={12} />,
    variant: "destructive",
    className: "bg-red-100 text-red-700 border-red-200 hover:bg-red-100",
  },
};

// ── Summary stat card ─────────────────────────────────────────────────────────
function StatCard({
  title,
  value,
  sub,
  icon,
  accent,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
              {title}
            </p>
            <p className="text-2xl font-bold text-gray-900 tracking-tight">
              {value}
            </p>
            {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
          </div>
          <div className={`p-2.5 rounded-xl ${accent}`}>{icon}</div>
        </div>
      </CardContent>
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 ${accent.replace("bg-", "bg-").replace("/10", "")}`}
      />
    </Card>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTransactions();
  }, [filterStatus]);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/transactions?status=${filterStatus}`);
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions ?? []);
      } else {
        toast.error("Failed to load transactions.");
      }
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
      toast.error("Failed to load transactions. Please refresh.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    transactionId: string,
    newStatus: string,
  ) => {
    setUpdatingId(transactionId);
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.error || "Failed to update transaction.");
        return;
      }

      setTransactions(
        transactions.map((t) =>
          t.id === transactionId ? { ...t, status: newStatus } : t,
        ),
      );
      toast.success("Transaction status updated.");
    } catch (error) {
      console.error("Failed to update transaction:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (transactionId: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const response = await fetch(`/api/transactions/${transactionId}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        toast.error(data.error || "Failed to delete transaction.");
        return;
      }
      setTransactions(transactions.filter((t) => t.id !== transactionId));
      toast.success("Transaction deleted.");
    } catch (error) {
      toast.error("Something went wrong. Please try again.");
    }
  };

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalAmount = transactions.reduce((sum, t) => sum + (t.amount ?? 0), 0);
  const avgAmount =
    transactions.length > 0 ? Math.round(totalAmount / transactions.length) : 0;
  const completedCount = transactions.filter(
    (t) => t.status === "completed",
  ).length;
  const completedRate =
    transactions.length > 0
      ? Math.round((completedCount / transactions.length) * 100)
      : 0;

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Page header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Transactions
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monitor and manage payment activity
            </p>
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-44 h-9 text-sm">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transactions</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Transactions"
            value={transactions.length.toString()}
            sub={
              filterStatus !== "all" ? `Filtered: ${filterStatus}` : "All time"
            }
            icon={<CreditCard size={18} className="text-blue-600" />}
            accent="bg-blue-50"
          />
          <StatCard
            title="Total Volume"
            value={`KES ${totalAmount.toLocaleString()}`}
            sub="Sum of all amounts"
            icon={<Wallet size={18} className="text-emerald-600" />}
            accent="bg-emerald-50"
          />
          <StatCard
            title="Average Amount"
            value={`KES ${avgAmount.toLocaleString()}`}
            sub="Per transaction"
            icon={<TrendingUp size={18} className="text-violet-600" />}
            accent="bg-violet-50"
          />
          <StatCard
            title="Success Rate"
            value={`${completedRate}%`}
            sub={`${completedCount} completed`}
            icon={<ArrowUpRight size={18} className="text-amber-600" />}
            accent="bg-amber-50"
          />
        </div>

        {/* ── Table ── */}
        {isLoading ? (
          <div className="flex justify-center items-center py-16">
            <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
            <span className="ml-3 text-sm text-muted-foreground">
              Loading transactions...
            </span>
          </div>
        ) : transactions.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <CreditCard
              size={36}
              className="mx-auto text-muted-foreground mb-3"
            />
            <p className="font-medium text-gray-700">No transactions found</p>
            <p className="text-sm text-muted-foreground mt-1">
              {filterStatus !== "all"
                ? `No ${filterStatus} transactions to display.`
                : "Transactions will appear here once payments are made."}
            </p>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b bg-gray-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {transactions.length} transaction
                  {transactions.length !== 1 ? "s" : ""}
                </CardTitle>
                <div className="flex gap-1.5">
                  {["completed", "pending", "failed"].map((s) => {
                    const count = transactions.filter(
                      (t) => t.status === s,
                    ).length;
                    if (count === 0) return null;
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <Badge
                        key={s}
                        variant="outline"
                        className={`text-xs ${cfg.className}`}
                      >
                        {count} {s}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Order ID
                    </TableHead>
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Amount
                    </TableHead>
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Method
                    </TableHead>
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Status
                    </TableHead>
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Date
                    </TableHead>
                    <TableHead className="px-6 text-xs font-semibold uppercase tracking-wide text-gray-500 text-right">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const cfg =
                      STATUS_CONFIG[transaction.status] ??
                      STATUS_CONFIG.pending;
                    const isUpdating = updatingId === transaction.id;

                    return (
                      <TableRow
                        key={transaction.id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        {/* Order ID */}
                        <TableCell className="px-6 py-4">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="font-mono text-sm text-gray-700 cursor-default">
                                #{(transaction.order_id ?? "—").slice(0, 8)}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent
                              side="top"
                              className="font-mono text-xs"
                            >
                              {transaction.order_id ?? "No order ID"}
                            </TooltipContent>
                          </Tooltip>
                        </TableCell>

                        {/* Amount */}
                        <TableCell className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            KES {(transaction.amount ?? 0).toLocaleString()}
                          </span>
                        </TableCell>

                        {/* Method — safe fallback */}
                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="text-xs font-medium bg-gray-50 text-gray-600 border-gray-200"
                          >
                            {(
                              transaction.payment_method ?? "N/A"
                            ).toUpperCase()}
                          </Badge>
                        </TableCell>

                        {/* Status */}
                        <TableCell className="px-6 py-4">
                          {isUpdating ? (
                            <Loader2
                              size={16}
                              className="animate-spin text-muted-foreground"
                            />
                          ) : (
                            <Select
                              value={transaction.status ?? "pending"}
                              onValueChange={(val) =>
                                handleStatusChange(transaction.id, val)
                              }
                            >
                              <SelectTrigger
                                className={`h-7 w-32 text-xs font-medium border rounded-full px-2.5 focus:ring-0 focus:ring-offset-0 ${cfg.className}`}
                              >
                                <div className="flex items-center gap-1.5">
                                  {cfg.icon}
                                  <SelectValue />
                                </div>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="completed">
                                  Completed
                                </SelectItem>
                                <SelectItem value="failed">Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>

                        {/* Date */}
                        <TableCell className="px-6 py-4 text-sm text-gray-500">
                          {transaction.created_at
                            ? new Date(
                                transaction.created_at,
                              ).toLocaleDateString("en-KE", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "—"}
                        </TableCell>

                        {/* Actions */}
                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                                >
                                  <Edit2 size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Edit</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => handleDelete(transaction.id)}
                                >
                                  <Trash2 size={14} />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Delete</TooltipContent>
                            </Tooltip>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
