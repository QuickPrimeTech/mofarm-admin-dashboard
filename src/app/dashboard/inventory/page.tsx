"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Edit2,
  AlertTriangle,
  Package,
  PackageSearch,
  TrendingDown,
  Banknote,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import EditInventoryModal from "@/app/dashboard/inventory/EditInventoryModal";

interface Product {
  id: string;
  name: string;
  stock_quantity: number;
  low_stock_threshold: number;
  price: number;
}

/* ─── Fetcher ────────────────────────────────────────────────── */
async function fetchProducts(): Promise<Product[]> {
  const response = await fetch("/api/products");
  if (!response.ok) throw new Error("Failed to load inventory.");
  const data = await response.json();
  return data.products;
}

/* ─── Summary stat card ──────────────────────────────────────── */
function SummaryCard({
  label,
  value,
  icon,
  accentClass,
  borderAccent,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accentClass: string;
  borderAccent: string;
}) {
  return (
    <Card
      className={`relative overflow-hidden border-l-4 ${borderAccent} shadow-sm hover:shadow-md transition-shadow duration-200`}
    >
      <div
        className={`absolute -right-6 -top-6 h-24 w-24 rounded-full opacity-10 ${accentClass.split(" ")[0]}`}
      />
      <CardHeader className="pb-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {label}
        </p>
      </CardHeader>
      <CardContent className="flex items-end justify-between gap-2">
        <p className="text-3xl font-extrabold tracking-tight text-zinc-900">
          {value}
        </p>
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}
        >
          {icon}
        </span>
      </CardContent>
    </Card>
  );
}

/* ─── Table skeleton ─────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-lg ml-auto" />
        </div>
      ))}
    </div>
  );
}

/* ─── Stock badge ────────────────────────────────────────────── */
function StockBadge({ isLow }: { isLow: boolean }) {
  return isLow ? (
    <Badge className="bg-red-50 text-red-600 border border-red-200 gap-1 font-semibold text-[11px]">
      <AlertTriangle className="h-3 w-3" /> Low Stock
    </Badge>
  ) : (
    <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 gap-1 font-semibold text-[11px]">
      <CheckCircle2 className="h-3 w-3" /> In Stock
    </Badge>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function InventoryPage() {
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ── Query ──────────────────────────────────────────────────────
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  // ── Mutation ───────────────────────────────────────────────────
  const updateMutation = useMutation({
    mutationFn: async ({
      productId,
      values,
    }: {
      productId: string;
      values: { stock_quantity: number; low_stock_threshold: number };
    }) => {
      const response = await fetch(`/api/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || "Failed to update inventory.");
      return data as Product;
    },

    // Optimistically update the cache before the server responds
    onMutate: async ({ productId, values }) => {
      await queryClient.cancelQueries({ queryKey: ["products"] });
      const previous = queryClient.getQueryData<Product[]>(["products"]);
      queryClient.setQueryData<Product[]>(["products"], (old = []) =>
        old.map((p) => (p.id === productId ? { ...p, ...values } : p)),
      );
      return { previous };
    },

    // Roll back if the server rejects the update
    onError: (error, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["products"], context.previous);
      }
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    },

    onSuccess: (updatedProduct) => {
      toast.success(`${updatedProduct.name} updated successfully!`);
      setEditingProduct(null);
    },

    // Always re-sync with server after mutation settles
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });

  const handleSave = async (
    productId: string,
    values: { stock_quantity: number; low_stock_threshold: number },
  ): Promise<void> => {
    updateMutation.mutate({ productId, values });
  };

  if (isError) toast.error("Failed to load inventory. Please refresh.");

  // ── Derived stats ──────────────────────────────────────────────
  const lowStockProducts = products.filter(
    (p) => p.stock_quantity < p.low_stock_threshold,
  );
  const totalValue = products.reduce(
    (sum, p) => sum + p.stock_quantity * p.price,
    0,
  );

  return (
    <div className="min-h-screen bg-zinc-50/60 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
              Stock
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Inventory
            </h1>
          </div>
          <Badge
            variant="outline"
            className="flex items-center gap-1.5 border-zinc-200 text-zinc-500 text-xs font-medium"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {products.length} products tracked
          </Badge>
        </div>

        <Separator className="bg-zinc-200" />

        {/* ── Summary Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <SummaryCard
            label="Total Products"
            value={products.length}
            icon={<Package className="h-5 w-5" />}
            accentClass="bg-violet-50 text-violet-600"
            borderAccent="border-l-violet-500"
          />
          <SummaryCard
            label="Low Stock Items"
            value={lowStockProducts.length}
            icon={<TrendingDown className="h-5 w-5" />}
            accentClass="bg-orange-50 text-orange-500"
            borderAccent="border-l-orange-500"
          />
          <SummaryCard
            label="Total Inventory Value"
            value={`KES ${totalValue.toLocaleString()}`}
            icon={<Banknote className="h-5 w-5" />}
            accentClass="bg-emerald-50 text-emerald-600"
            borderAccent="border-l-emerald-500"
          />
        </div>

        {/* ── Low Stock Alert Banner ── */}
        {lowStockProducts.length > 0 && (
          <Card className="border-orange-200 border bg-orange-50/60 shadow-sm overflow-hidden">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-start gap-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 shrink-0 mt-0.5">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="font-bold text-orange-900 text-sm">
                    {lowStockProducts.length} product
                    {lowStockProducts.length > 1 ? "s" : ""} below threshold
                  </p>
                  <p className="text-orange-700 text-xs mt-0.5 mb-3">
                    Restock soon to avoid running out.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {lowStockProducts.map((p) => (
                      <span
                        key={p.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-800 text-xs font-semibold border border-orange-200"
                      >
                        {p.name}
                        <span className="text-orange-500 font-bold">·</span>
                        {p.stock_quantity} / {p.low_stock_threshold} units
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Inventory Table ── */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-900">
                Stock Levels
              </CardTitle>
              <Badge
                variant="secondary"
                className="text-xs text-zinc-500 font-medium"
              >
                {products.length} item{products.length !== 1 ? "s" : ""}
              </Badge>
            </div>
          </CardHeader>

          {isLoading ? (
            <TableSkeleton />
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
              <PackageSearch className="h-10 w-10 text-zinc-300" />
              <p className="text-zinc-400 text-sm font-medium">
                No products in inventory yet.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  {[
                    "Product Name",
                    "Current Stock",
                    "Threshold",
                    "Value (KES)",
                    "Status",
                    "",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className={`text-xs font-semibold uppercase tracking-wider text-zinc-400 ${h === "" ? "text-right pr-6" : "pl-6"}`}
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => {
                  const isLow =
                    product.stock_quantity < product.low_stock_threshold;
                  return (
                    <TableRow
                      key={product.id}
                      className="hover:bg-zinc-50/70 transition-colors group"
                    >
                      <TableCell className="pl-6 py-4 font-semibold text-zinc-900 text-sm">
                        {product.name}
                      </TableCell>
                      <TableCell className="py-4">
                        <span
                          className={`text-sm font-bold ${isLow ? "text-red-500" : "text-zinc-800"}`}
                        >
                          {product.stock_quantity}
                        </span>
                      </TableCell>
                      <TableCell className="py-4 text-zinc-500 text-sm">
                        {product.low_stock_threshold}
                      </TableCell>
                      <TableCell className="py-4 font-semibold text-zinc-900 text-sm">
                        KES{" "}
                        {(
                          product.stock_quantity * product.price
                        ).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-4">
                        <StockBadge isLow={isLow} />
                      </TableCell>
                      <TableCell className="py-4 pr-6 text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingProduct(product)}
                          disabled={updateMutation.isPending}
                          className="h-8 gap-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>

      {editingProduct && (
        <EditInventoryModal
          product={editingProduct}
          onClose={() => setEditingProduct(null)}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
