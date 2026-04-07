import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePage } from "@/lib/revalidate";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: offers, error } = await supabase
      .from("special_offers")
      .select(
        `
    *,
    product:products (
      id,
      name,
      price
    )
  `,
      )
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({
      offers: offers || [],
    });
  } catch (error) {
    console.error("Failed to fetch offers:", error);
    return NextResponse.json(
      { error: "Failed to fetch offers" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { product_id, discount_percentage, valid_from, valid_to } = body;

    if (!product_id || !discount_percentage || !valid_from || !valid_to) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data: offer, error } = await supabase
      .from("special_offers")
      .insert([
        {
          product_id,
          discount_percentage,
          valid_from,
          valid_to,
          active: true,
        },
      ])
      .select(
        `
    *,
    product:products (
      id,
      name,
      price
    )
  `,
      )
      .single();

    if (error) throw error;

    await revalidatePage("/");

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Failed to create offer:", error);
    return NextResponse.json(
      { error: "Failed to create offer" },
      { status: 500 },
    );
  }
}
