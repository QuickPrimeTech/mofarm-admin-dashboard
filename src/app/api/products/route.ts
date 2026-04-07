import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePage } from "@/lib/revalidate";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      products: products || [],
    });
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const {
      name,
      description,
      price,
      stock_quantity,
      category,
      low_stock_threshold,
      image_url,
    } = body;

    if (!name || !price || stock_quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert([
        {
          name,
          description,
          price,
          stock_quantity,
          category,
          low_stock_threshold: low_stock_threshold || 10,
          image_url: image_url || null,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    await revalidatePage("/");

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error("Failed to create product:", error);
    return NextResponse.json(
      { error: "Failed to create product" },
      { status: 500 },
    );
  }
}
