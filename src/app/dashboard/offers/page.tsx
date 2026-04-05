"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Tag,
  ToggleLeft,
  ToggleRight,
  Percent,
  CalendarRange,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
}

interface Offer {
  id: string;
  product_id: string;
  product?: Product;
  discount_percentage: number;
  valid_from: string;
  valid_to: string;
  active: boolean;
}

const EMPTY_FORM = {
  product_id: "",
  discount_percentage: "",
  valid_from: "",
  valid_to: "",
  active: true,
};

/* ─── Fetchers ───────────────────────────────────────────────── */
async function fetchOffers(): Promise<Offer[]> {
  const res = await fetch("/api/offers");
  if (!res.ok) throw new Error("Failed to load offers.");
  return (await res.json()).offers ?? [];
}

async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to load products.");
  return (await res.json()).products ?? [];
}

/* ─── Stat card ──────────────────────────────────────────────── */
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
    <Card className="border-0 shadow-sm">
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
    </Card>
  );
}

/* ─── Offer form ─────────────────────────────────────────────── */
function OfferForm({
  title,
  form,
  setForm,
  products,
  isSubmitting,
  showActive,
  onSubmit,
  onCancel,
  submitLabel,
  accentClass,
}: {
  title: string;
  form: typeof EMPTY_FORM;
  setForm: (f: typeof EMPTY_FORM) => void;
  products: Product[];
  isSubmitting: boolean;
  showActive: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  submitLabel: string;
  accentClass: string;
}) {
  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
      </DialogHeader>
      <form onSubmit={onSubmit} className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Label>Product *</Label>
          <Select
            value={form.product_id}
            onValueChange={(v) => setForm({ ...form, product_id: v })}
            disabled={isSubmitting}
            required
          >
            <SelectTrigger className="h-10">
              <SelectValue placeholder="Select a product" />
            </SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} — KSh {p.price.toLocaleString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Discount % *</Label>
          <div className="relative">
            <Input
              type="number"
              value={form.discount_percentage}
              onChange={(e) =>
                setForm({ ...form, discount_percentage: e.target.value })
              }
              placeholder="e.g. 15"
              step="0.01"
              min="0"
              max="100"
              required
              disabled={isSubmitting}
              className="pr-10"
            />
            <Percent
              size={14}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Valid From *</Label>
            <Input
              type="datetime-local"
              value={form.valid_from}
              onChange={(e) => setForm({ ...form, valid_from: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Valid To *</Label>
            <Input
              type="datetime-local"
              value={form.valid_to}
              onChange={(e) => setForm({ ...form, valid_to: e.target.value })}
              required
              disabled={isSubmitting}
            />
          </div>
        </div>

        {showActive && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <Switch
              id="active-toggle"
              checked={form.active}
              onCheckedChange={(v) => setForm({ ...form, active: v })}
              disabled={isSubmitting}
            />
            <Label htmlFor="active-toggle" className="cursor-pointer">
              Mark as{" "}
              <span
                className={
                  form.active ? "text-green-600 font-semibold" : "text-gray-500"
                }
              >
                {form.active ? "Active" : "Inactive"}
              </span>
            </Label>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 h-11"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className={`flex-1 h-11 ${accentClass}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              submitLabel
            )}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function OffersPage() {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  /* ── Queries ─────────────────────────────────────────────────── */
  const { data: offers = [], isLoading: offersLoading } = useQuery({
    queryKey: ["offers"],
    queryFn: fetchOffers,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["products"],
    queryFn: fetchProducts,
  });

  const isLoading = offersLoading || productsLoading;

  /* ── Create mutation ─────────────────────────────────────────── */
  const createMutation = useMutation({
    mutationFn: async (form: typeof EMPTY_FORM) => {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          discount_percentage: parseFloat(form.discount_percentage),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create offer.");
      return data as Offer;
    },
    onSuccess: (newOffer) => {
      queryClient.setQueryData<Offer[]>(["offers"], (old = []) => [
        newOffer,
        ...old,
      ]);
      setCreateForm(EMPTY_FORM);
      setShowCreateDialog(false);
      toast.success("Offer created successfully!");
    },
    onError: (error) => {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });

  /* ── Update mutation ─────────────────────────────────────────── */
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      body,
    }: {
      id: string;
      body: Partial<Offer> & { discount_percentage?: number | string };
    }) => {
      const res = await fetch(`/api/offers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update offer.");
      return data as Offer;
    },
    onMutate: async ({ id, body }) => {
      await queryClient.cancelQueries({ queryKey: ["offers"] });
      const previous = queryClient.getQueryData<Offer[]>(["offers"]);
      queryClient.setQueryData<Offer[]>(["offers"], (old = []) =>
        old.map((o) => (o.id === id ? { ...o, ...body } : o)),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["offers"], context.previous);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    },
    onSuccess: (updatedOffer) => {
      queryClient.setQueryData<Offer[]>(["offers"], (old = []) =>
        old.map((o) => (o.id === updatedOffer.id ? updatedOffer : o)),
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });

  /* ── Delete mutation ─────────────────────────────────────────── */
  const deleteMutation = useMutation({
    mutationFn: async (offerId: string) => {
      const res = await fetch(`/api/offers/${offerId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete offer.");
      return offerId;
    },
    onMutate: async (offerId) => {
      await queryClient.cancelQueries({ queryKey: ["offers"] });
      const previous = queryClient.getQueryData<Offer[]>(["offers"]);
      queryClient.setQueryData<Offer[]>(["offers"], (old = []) =>
        old.filter((o) => o.id !== offerId),
      );
      return { previous };
    },
    onError: (error, _vars, context) => {
      if (context?.previous)
        queryClient.setQueryData(["offers"], context.previous);
      toast.error(
        error instanceof Error ? error.message : "Something went wrong.",
      );
    },
    onSuccess: () => {
      toast.success("Offer deleted successfully.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["offers"] });
    },
  });

  /* ── Handlers ────────────────────────────────────────────────── */
  const handleAddOffer = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleEditClick = (offer: Offer) => {
    setEditingOffer(offer);
    setEditForm({
      product_id: offer.product_id,
      discount_percentage: offer.discount_percentage.toString(),
      valid_from: offer.valid_from.slice(0, 16),
      valid_to: offer.valid_to.slice(0, 16),
      active: offer.active,
    });
  };

  const handleUpdateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOffer) return;
    updateMutation.mutate(
      {
        id: editingOffer.id,
        body: {
          ...editForm,
          discount_percentage: parseFloat(editForm.discount_percentage),
        },
      },
      {
        onSuccess: () => {
          setEditingOffer(null);
          toast.success("Offer updated successfully!");
        },
      },
    );
  };

  const handleToggleActive = (offerId: string, currentActive: boolean) => {
    updateMutation.mutate(
      { id: offerId, body: { active: !currentActive } },
      {
        onSuccess: () => {
          toast.success(
            `Offer marked as ${!currentActive ? "active" : "inactive"}.`,
          );
        },
      },
    );
  };

  const handleDeleteOffer = (offerId: string) => {
    if (!confirm("Are you sure you want to delete this offer?")) return;
    deleteMutation.mutate(offerId);
  };

  /* ── Derived stats ───────────────────────────────────────────── */
  const activeOffers = offers.filter((o) => o.active);
  const discountTotal = activeOffers.reduce(
    (sum, o) => sum + o.discount_percentage,
    0,
  );
  const expiredOffers = offers.filter((o) => new Date(o.valid_to) < new Date());

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Loading offers...</span>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Special Offers
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Manage discounts and promotions
            </p>
          </div>
          <Button
            onClick={() => setShowCreateDialog(true)}
            className="bg-green-600 hover:bg-green-700 h-9"
          >
            <Plus size={16} className="mr-2" />
            Create Offer
          </Button>
        </div>

        {/* ── Stat cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Offers"
            value={offers.length.toString()}
            sub="All time"
            icon={<Tag size={18} className="text-blue-600" />}
            accent="bg-blue-50"
          />
          <StatCard
            title="Active Offers"
            value={activeOffers.length.toString()}
            sub="Currently running"
            icon={<Sparkles size={18} className="text-green-600" />}
            accent="bg-green-50"
          />
          <StatCard
            title="Total Discount"
            value={`${discountTotal.toFixed(1)}%`}
            sub="Sum across active offers"
            icon={<Percent size={18} className="text-violet-600" />}
            accent="bg-violet-50"
          />
          <StatCard
            title="Expired Offers"
            value={expiredOffers.length.toString()}
            sub="Past valid_to date"
            icon={<CalendarRange size={18} className="text-amber-600" />}
            accent="bg-amber-50"
          />
        </div>

        {/* ── Table ── */}
        {offers.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Tag size={36} className="mx-auto text-muted-foreground mb-3" />
            <p className="font-medium text-gray-700">No offers yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Create your first offer to start running promotions.
            </p>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(true)}
              className="text-green-600 border-green-200 hover:bg-green-50"
            >
              <Plus className="mr-2 h-4 w-4" /> Create your first offer
            </Button>
          </Card>
        ) : (
          <Card className="border shadow-sm overflow-hidden">
            <CardHeader className="px-6 py-4 border-b bg-gray-50/60">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {offers.length} offer{offers.length !== 1 ? "s" : ""}
                </CardTitle>
                <div className="flex gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-xs bg-green-50 text-green-700 border-green-200"
                  >
                    {activeOffers.length} active
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gray-50 text-gray-600 border-gray-200"
                  >
                    {offers.length - activeOffers.length} inactive
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50/40 hover:bg-gray-50/40">
                    {[
                      "Product",
                      "Discount",
                      "Valid From",
                      "Valid To",
                      "Status",
                      "",
                    ].map((h) => (
                      <TableHead
                        key={h}
                        className={`px-6 text-xs font-semibold uppercase tracking-wide text-gray-500 ${h === "" ? "text-right" : ""}`}
                      >
                        {h}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => {
                    const isExpired = new Date(offer.valid_to) < new Date();
                    const isToggling =
                      updateMutation.isPending &&
                      updateMutation.variables?.id === offer.id;
                    const isDeleting =
                      deleteMutation.isPending &&
                      deleteMutation.variables === offer.id;

                    return (
                      <TableRow
                        key={offer.id}
                        className="hover:bg-gray-50/60 transition-colors group"
                      >
                        <TableCell className="px-6 py-4 font-medium text-gray-900">
                          {offer.product?.name ?? "Unknown Product"}
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className="bg-violet-50 text-violet-700 border-violet-200 font-semibold"
                          >
                            {offer.discount_percentage}% off
                          </Badge>
                        </TableCell>

                        <TableCell className="px-6 py-4 text-sm text-gray-600">
                          {new Date(offer.valid_from).toLocaleDateString(
                            "en-KE",
                            { day: "numeric", month: "short", year: "numeric" },
                          )}
                        </TableCell>

                        <TableCell className="px-6 py-4 text-sm text-gray-600">
                          <span className={isExpired ? "text-red-500" : ""}>
                            {new Date(offer.valid_to).toLocaleDateString(
                              "en-KE",
                              {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              },
                            )}
                          </span>
                          {isExpired && (
                            <Badge
                              variant="outline"
                              className="ml-2 text-xs bg-red-50 text-red-600 border-red-200"
                            >
                              Expired
                            </Badge>
                          )}
                        </TableCell>

                        <TableCell className="px-6 py-4">
                          <Badge
                            variant="outline"
                            className={
                              offer.active
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : "bg-gray-100 text-gray-500 border-gray-200"
                            }
                          >
                            {offer.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>

                        <TableCell className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleToggleActive(offer.id, offer.active)
                                  }
                                  disabled={isToggling}
                                  className={`h-8 w-8 ${offer.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"}`}
                                >
                                  {isToggling ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : offer.active ? (
                                    <ToggleRight size={16} />
                                  ) : (
                                    <ToggleLeft size={16} />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {offer.active ? "Deactivate" : "Activate"}
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEditClick(offer)}
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
                                  onClick={() => handleDeleteOffer(offer.id)}
                                  disabled={isDeleting}
                                  className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                >
                                  {isDeleting ? (
                                    <Loader2
                                      size={14}
                                      className="animate-spin"
                                    />
                                  ) : (
                                    <Trash2 size={14} />
                                  )}
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

        {/* ── Create Dialog ── */}
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <OfferForm
            title="Create New Offer"
            form={createForm}
            setForm={setCreateForm}
            products={products}
            isSubmitting={createMutation.isPending}
            showActive={false}
            onSubmit={handleAddOffer}
            onCancel={() => setShowCreateDialog(false)}
            submitLabel="Create Offer"
            accentClass="bg-green-600 hover:bg-green-700"
          />
        </Dialog>

        {/* ── Edit Dialog ── */}
        <Dialog
          open={!!editingOffer}
          onOpenChange={(o) => !o && setEditingOffer(null)}
        >
          <OfferForm
            title="Edit Offer"
            form={editForm}
            setForm={setEditForm}
            products={products}
            isSubmitting={updateMutation.isPending}
            showActive={true}
            onSubmit={handleUpdateOffer}
            onCancel={() => setEditingOffer(null)}
            submitLabel="Save Changes"
            accentClass="bg-blue-600 hover:bg-blue-700"
          />
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
