"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Trash2,
  Plus,
  X,
  ImageIcon,
  PackageSearch,
  AlertTriangle,
  CheckCircle2,
  Upload,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Image from "next/image";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  stock_quantity: number;
  category?: string;
  low_stock_threshold: number;
  created_at: string;
  image_url?: string | null;
}

type FormMode = "add" | "edit" | null;

// ── Query Keys ────────────────────────────────────────────────────────────────
export const queryKeys = {
  products: ["products"] as const,
};

// ── Fetcher ───────────────────────────────────────────────────────────────────
async function fetchProducts(): Promise<Product[]> {
  const res = await fetch("/api/products");
  if (!res.ok) throw new Error("Failed to fetch products.");
  const data = await res.json();
  return data.products ?? [];
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function getStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/");
    const bucketIndex = pathParts.indexOf("product-images");
    if (bucketIndex !== -1 && pathParts[bucketIndex + 1])
      return pathParts.slice(bucketIndex + 1).join("/");
    return null;
  } catch {
    return null;
  }
}

/* ─── Label helper ───────────────────────────────────────────── */
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-1.5">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}

/* ─── Stock Badge ────────────────────────────────────────────── */
function StockBadge({ product }: { product: Product }) {
  const isLow = product.stock_quantity < product.low_stock_threshold;
  return isLow ? (
    <Badge className="bg-red-50 text-red-600 border-red-200 border gap-1 font-semibold text-[11px]">
      <AlertTriangle className="h-3 w-3" /> Low Stock
    </Badge>
  ) : (
    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 border gap-1 font-semibold text-[11px]">
      <CheckCircle2 className="h-3 w-3" /> In Stock
    </Badge>
  );
}

/* ─── Table Skeleton ─────────────────────────────────────────── */
function TableSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3.5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-3.5 w-20" />
          <Skeleton className="h-3.5 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-16 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/* ─── Main Page ──────────────────────────────────────────────── */
export default function ProductsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [formMode, setFormMode] = useState<FormMode>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    stock_quantity: "",
    category: "",
    low_stock_threshold: "10",
    image_url: "",
  });

  // ── Query ─────────────────────────────────────────────────────────────────
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: queryKeys.products,
    queryFn: fetchProducts,
  });

  useEffect(() => {
    if (isError) console.error("Failed to fetch products.");
  }, [isError]);

  // ── Mutations ─────────────────────────────────────────────────────────────
  const addMutation = useMutation({
    mutationFn: async ({
      formData,
      imageFile,
    }: {
      formData: typeof productForm;
      imageFile: File | null;
    }) => {
      let imageUrl: string | null = null;

      if (imageFile) {
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(fileName, imageFile);
        if (error) throw new Error("Image upload failed.");
        const { data: publicUrlData } = supabase.storage
          .from("product-images")
          .getPublicUrl(fileName);
        imageUrl = publicUrlData.publicUrl;
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          category: formData.category || null,
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity),
          low_stock_threshold: parseInt(formData.low_stock_threshold),
          image_url: imageUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to add product.");
      }
      return res.json() as Promise<Product>;
    },
    onSuccess: (newProduct) => {
      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) => [
        newProduct,
        ...old,
      ]);
      resetForm();
      toast.success("Product added successfully!");
    },
    onError: (err) => {
      console.error("Add product failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to add product.",
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      formData,
      imageFile,
      removeImage,
      oldImageUrl,
    }: {
      id: string;
      formData: typeof productForm;
      imageFile: File | null;
      removeImage: boolean;
      oldImageUrl: string;
    }) => {
      const BUCKET = "product-images";
      let newImageUrl: string | null = oldImageUrl || null;

      if (imageFile) {
        if (oldImageUrl) {
          const oldPath = getStoragePathFromUrl(oldImageUrl);
          if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
        }
        const fileName = `${Date.now()}-${imageFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from(BUCKET)
          .upload(fileName, imageFile);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
        newImageUrl = data.publicUrl;
      } else if (removeImage && oldImageUrl) {
        const oldPath = getStoragePathFromUrl(oldImageUrl);
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]);
        newImageUrl = null;
      }

      const res = await fetch(`/api/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description || null,
          price: Number(formData.price) || 0,
          stock_quantity: Number(formData.stock_quantity) || 0,
          category: formData.category || null,
          low_stock_threshold: Number(formData.low_stock_threshold) || 0,
          image_url: newImageUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update product.");
      }
      return res.json() as Promise<Product>;
    },
    onSuccess: (updatedProduct) => {
      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) =>
        old.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)),
      );
      resetForm();
      toast.success("Product updated successfully!");
    },
    onError: (err) => {
      console.error("Update product failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to update product.",
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (product: Product) => {
      if (product.image_url) {
        const path = getStoragePathFromUrl(product.image_url);
        if (path) await supabase.storage.from("product-images").remove([path]);
      }
      const res = await fetch(`/api/products/${product.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete product.");
      }
      return product.id;
    },
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.products });
      const previousProducts = queryClient.getQueryData<Product[]>(
        queryKeys.products,
      );
      queryClient.setQueryData<Product[]>(queryKeys.products, (old = []) =>
        old.filter((p) => p.id !== product.id),
      );
      return { previousProducts };
    },
    onSuccess: () => {
      toast.success("Product deleted successfully.");
    },
    onError: (err, _product, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(queryKeys.products, context.previousProducts);
      }
      console.error("Delete product failed:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to delete product.",
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.products });
    },
  });

  // ── Helpers ───────────────────────────────────────────────────────────────
  const resetForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      stock_quantity: "",
      category: "",
      low_stock_threshold: "10",
      image_url: "",
    });
    setImageFile(null);
    setEditingProduct(null);
    setFormMode(null);
    setRemoveImage(false);
  };

  const openAddForm = () => {
    resetForm();
    setFormMode("add");
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description || "",
      price: product.price.toString(),
      stock_quantity: product.stock_quantity.toString(),
      category: product.category || "",
      low_stock_threshold: product.low_stock_threshold.toString(),
      image_url: product.image_url || "",
    });
    setImageFile(null);
    setRemoveImage(false);
    setFormMode("edit");
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({ formData: productForm, imageFile });
  };

  const handleUpdateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    updateMutation.mutate({
      id: editingProduct.id,
      formData: productForm,
      imageFile,
      removeImage,
      oldImageUrl: editingProduct.image_url || "",
    });
  };

  const handleDeleteProduct = (product: Product) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    deleteMutation.mutate(product);
  };

  const handleRemoveImageClick = () => {
    setRemoveImage(true);
    setImageFile(null);
    setProductForm((prev) => ({ ...prev, image_url: "" }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setImageFile(e.target.files[0]);
      setRemoveImage(false);
    }
  };

  const showCurrentImage =
    formMode === "edit" && productForm.image_url && !removeImage && !imageFile;
  const handleSubmit =
    formMode === "add" ? handleAddProduct : handleUpdateProduct;
  const isMutating = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="min-h-screen bg-zinc-50/60 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* ── Header ── */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
              Inventory
            </p>
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
              Products
            </h1>
          </div>
          <Button
            onClick={openAddForm}
            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm gap-2 font-semibold"
          >
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        </div>

        <Separator className="bg-zinc-200" />

        {/* ── Add / Edit Form ── */}
        {formMode && (
          <Card className="border-emerald-200 border-2 shadow-md overflow-hidden">
            <CardHeader className="bg-emerald-50/60 pb-4 flex flex-row items-start justify-between">
              <div>
                <CardTitle className="text-lg font-bold text-zinc-900">
                  {formMode === "add" ? "Add New Product" : "Edit Product"}
                </CardTitle>
                <CardDescription className="text-zinc-500 text-xs mt-1">
                  {formMode === "add"
                    ? "Fill in the details below to list a new product."
                    : "Update the product details below."}
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={resetForm}
                className="text-zinc-400 hover:text-zinc-700 -mt-1"
              >
                <X className="h-5 w-5" />
              </Button>
            </CardHeader>

            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Current Image Preview */}
                {showCurrentImage && (
                  <div>
                    <FieldLabel>Current Image</FieldLabel>
                    <div className="flex items-start gap-4">
                      <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-zinc-200 shadow-sm">
                        <Image
                          src={productForm.image_url}
                          alt="Current product"
                          fill
                          className="object-cover"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={handleRemoveImageClick}
                        className="mt-2 gap-1.5 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" /> Remove Image
                      </Button>
                    </div>
                  </div>
                )}

                {removeImage && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-700 text-sm">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    Image will be removed when you save.
                  </div>
                )}

                {/* Name + Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel required>Product Name</FieldLabel>
                    <Input
                      value={productForm.name}
                      onChange={(e) =>
                        setProductForm({ ...productForm, name: e.target.value })
                      }
                      placeholder="e.g. Fresh Tomatoes"
                      required
                      disabled={isMutating}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <FieldLabel>Category</FieldLabel>
                    <Input
                      value={productForm.category}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          category: e.target.value,
                        })
                      }
                      placeholder="e.g. Vegetables"
                      disabled={isMutating}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value,
                      })
                    }
                    placeholder="Short product description..."
                    rows={3}
                    disabled={isMutating}
                    className="w-full px-3 py-2 text-sm border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white text-zinc-900 placeholder:text-zinc-400 disabled:opacity-60"
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <FieldLabel>
                    {formMode === "edit" && productForm.image_url
                      ? "Replace Image"
                      : "Product Image"}
                  </FieldLabel>
                  <label
                    className={`flex flex-col items-center justify-center gap-2 w-full h-28 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
                      removeImage || isMutating
                        ? "border-zinc-200 bg-zinc-50 opacity-50 cursor-not-allowed"
                        : "border-zinc-300 hover:border-emerald-400 hover:bg-emerald-50/40"
                    }`}
                  >
                    <Upload className="h-5 w-5 text-zinc-400" />
                    <span className="text-xs text-zinc-500 font-medium">
                      {imageFile ? imageFile.name : "Click to upload an image"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      disabled={removeImage || isMutating}
                      className="hidden"
                    />
                  </label>
                  {imageFile && (
                    <p className="text-xs text-emerald-600 font-medium mt-1.5">
                      ✓ {imageFile.name} selected
                    </p>
                  )}
                </div>

                {/* Price, Stock, Threshold */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <FieldLabel required>Price (KES)</FieldLabel>
                    <Input
                      type="number"
                      value={productForm.price}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          price: e.target.value,
                        })
                      }
                      step="0.01"
                      placeholder="0.00"
                      required
                      disabled={isMutating}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <FieldLabel required>Stock Qty</FieldLabel>
                    <Input
                      type="number"
                      value={productForm.stock_quantity}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          stock_quantity: e.target.value,
                        })
                      }
                      placeholder="0"
                      required
                      disabled={isMutating}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                  <div>
                    <FieldLabel>Low Stock Alert</FieldLabel>
                    <Input
                      type="number"
                      value={productForm.low_stock_threshold}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          low_stock_threshold: e.target.value,
                        })
                      }
                      placeholder="10"
                      disabled={isMutating}
                      className="focus-visible:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isMutating}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-2 shadow-sm"
                  >
                    {formMode === "add" ? (
                      <>
                        <Plus className="h-4 w-4" />
                        {addMutation.isPending ? "Adding..." : "Add Product"}
                      </>
                    ) : (
                      <>
                        <Edit2 className="h-4 w-4" />
                        {updateMutation.isPending
                          ? "Saving..."
                          : "Update Product"}
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isMutating}
                    className="text-zinc-600"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Products Table ── */}
        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="pb-3 border-b border-zinc-100">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold text-zinc-900">
                All Products
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
            <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
              <PackageSearch className="h-10 w-10 text-zinc-300" />
              <p className="text-zinc-400 font-medium text-sm">
                No products yet. Add your first one!
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-zinc-50 hover:bg-zinc-50">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400 pl-6">
                    Product
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Category
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Price
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Stock
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                    Status
                  </TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-zinc-400 text-right pr-6">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="hover:bg-zinc-50/70 transition-colors group"
                  >
                    <TableCell className="pl-6 py-4">
                      <div className="flex items-center gap-3">
                        {product.image_url ? (
                          <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-zinc-200 shrink-0">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                            <ImageIcon className="h-4 w-4 text-zinc-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-zinc-900 text-sm">
                            {product.name}
                          </p>
                          {product.description && (
                            <p className="text-xs text-zinc-400 mt-0.5 max-w-xs truncate">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {product.category ? (
                        <Badge
                          variant="secondary"
                          className="text-xs font-medium text-zinc-600 bg-zinc-100"
                        >
                          {product.category}
                        </Badge>
                      ) : (
                        <span className="text-zinc-300 text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-bold text-zinc-900 text-sm">
                      KES {product.price.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`text-sm font-semibold ${
                          product.stock_quantity < product.low_stock_threshold
                            ? "text-red-500"
                            : "text-zinc-700"
                        }`}
                      >
                        {product.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell>
                      <StockBadge product={product} />
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditForm(product)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product)}
                          disabled={deleteMutation.isPending}
                          className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}
