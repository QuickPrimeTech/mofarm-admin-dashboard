// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePage } from "@/lib/revalidate";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const { data: product, error } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return NextResponse.json(product);
  } catch (error) {
    console.error("Failed to understand the product:", error);
    return NextResponse.json(
      { error: "Failed to fetch product" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;
    const body = await request.json();

    // ✅ Build update object with only fields that were sent
    const updateData: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined)
      updateData.description = body.description || null;
    if (body.price !== undefined) updateData.price = Number(body.price);
    if (body.stock_quantity !== undefined)
      updateData.stock_quantity = Number(body.stock_quantity);
    if (body.category !== undefined) updateData.category = body.category;
    if (body.low_stock_threshold !== undefined)
      updateData.low_stock_threshold = Number(body.low_stock_threshold);
    if (body.image_url !== undefined)
      updateData.image_url = body.image_url || null;

    const { data, error } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await revalidatePage("/");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to update product:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    // Get existing image to delete from storage
    const { data: product } = await supabase
      .from("products")
      .select("image_url")
      .eq("id", id)
      .single();

    if (product?.image_url) {
      const BUCKET = "product-images";
      const path = product.image_url.split(`${BUCKET}/`)[1];
      if (path) {
        await supabase.storage.from(BUCKET).remove([path]);
      }
    }

    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    await revalidatePage("/");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete product:", error);
    return NextResponse.json(
      { error: "Failed to delete product" },
      { status: 500 },
    );
  }
}
