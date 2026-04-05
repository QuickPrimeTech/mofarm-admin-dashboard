"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ShoppingCart,
  DollarSign,
  Package,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
} from "lucide-react";

interface DashboardMetrics {
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  lowStockCount: number;
  revenueData: Array<{ date: string; amount: number }>;
  orderData: Array<{ date: string; count: number }>;
}

// ── Query Keys ────────────────────────────────────────────────────────────────
export const queryKeys = {
  dashboardMetrics: ["dashboard", "metrics"] as const,
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
async function fetchDashboardMetrics(): Promise<DashboardMetrics> {
  const res = await fetch("/api/dashboard/metrics");
  if (!res.ok) throw new Error("Failed to load dashboard metrics.");
  return res.json();
}

/* ─── Custom Tooltip ─────────────────────────────────────────── */
const CustomTooltip = ({
  active,
  payload,
  label,
  prefix = "",
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
  prefix?: string;
}) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-xl">
        <p className="text-xs font-medium text-zinc-400 mb-1">{label}</p>
        <p className="text-base font-bold text-zinc-900">
          {prefix}
          {payload[0].value.toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

/* ─── Stat Card ──────────────────────────────────────────────── */
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentClass: string;
  borderAccent: string;
  trend?: number;
}

function StatCard({
  label,
  value,
  icon,
  accentClass,
  borderAccent,
  trend,
}: StatCardProps) {
  const isPositive = trend === undefined || trend >= 0;

  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${borderAccent} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 ${accentClass.split(" ")[0]}`}
      />
      <CardHeader className="pb-2">
        <CardDescription className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <p className="text-3xl font-extrabold tracking-tight text-zinc-900">
          {value}
        </p>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}
          >
            {icon}
          </span>
          {trend !== undefined && (
            <Badge
              variant="secondary"
              className={`flex items-center gap-1 text-[11px] font-semibold ${
                isPositive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {Math.abs(trend)}%
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Skeleton loader ────────────────────────────────────────── */
function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="h-9 w-48 rounded-lg bg-zinc-200" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="p-6 space-y-3">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-8 w-32" />
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i} className="p-6">
            <Skeleton className="h-5 w-36 mb-6" />
            <Skeleton className="h-64 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function DashboardPage() {
  const {
    data: metrics,
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.dashboardMetrics,
    queryFn: fetchDashboardMetrics,
  });

  if (isLoading) return <DashboardSkeleton />;

  if (isError || !metrics) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-zinc-500 font-medium">
          Failed to load dashboard metrics.
        </p>
      </div>
    );
  }

  const statCards: StatCardProps[] = [
    {
      label: "Total Orders",
      value: metrics.totalOrders.toLocaleString(),
      icon: <ShoppingCart className="h-5 w-5" />,
      accentClass: "bg-emerald-50 text-emerald-600",
      borderAccent: "border-l-emerald-500",
      trend: 12,
    },
    {
      label: "Total Revenue",
      value: `KES ${metrics.totalRevenue.toLocaleString()}`,
      icon: <DollarSign className="h-5 w-5" />,
      accentClass: "bg-blue-50 text-blue-600",
      borderAccent: "border-l-blue-500",
      trend: 8,
    },
    {
      label: "Total Products",
      value: metrics.totalProducts.toLocaleString(),
      icon: <Package className="h-5 w-5" />,
      accentClass: "bg-violet-50 text-violet-600",
      borderAccent: "border-l-violet-500",
    },
    {
      label: "Low Stock Items",
      value: metrics.lowStockCount.toLocaleString(),
      icon: <AlertCircle className="h-5 w-5" />,
      accentClass: "bg-orange-50 text-orange-500",
      borderAccent: "border-l-orange-500",
      trend: -3,
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50/60 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
              Overview
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Dashboard
            </h1>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-zinc-200 text-zinc-500 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Live data
          </Badge>
        </div>

        <Separator className="bg-zinc-200" />

        {/* ── Stat Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {statCards.map((card) => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>

        {/* ── Charts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-zinc-900">
                    Revenue Trend
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-0.5">
                    Monthly revenue in KES
                  </CardDescription>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +8% this month
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart
                  data={metrics.revenueData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
                >
                  <defs>
                    <linearGradient
                      id="revenueGrad"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.15}
                      />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip prefix="KES " />} />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    dot={{ fill: "#10b981", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Orders Trend */}
          <Card className="shadow-sm hover:shadow-md transition-shadow duration-200">
            <CardHeader className="pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-zinc-900">
                    Orders Trend
                  </CardTitle>
                  <CardDescription className="text-xs text-zinc-400 mt-0.5">
                    Daily order volume
                  </CardDescription>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  +12% this week
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={metrics.orderData}
                  margin={{ top: 4, right: 8, bottom: 0, left: -16 }}
                  barSize={20}
                >
                  <defs>
                    <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#f0f0f0"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#a1a1aa" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="url(#barGrad)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
