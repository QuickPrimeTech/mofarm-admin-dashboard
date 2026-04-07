// app/api/offers/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { revalidatePage } from "@/lib/revalidate";

// Allowed fields that can be updated (security whitelist)
const ALLOWED_UPDATE_FIELDS = [
  "active",
  "product_id", // ✅ Added — was missing, causing silent strip on edit
  "discount_percentage",
  "valid_from",
  "valid_to",
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = await createClient();
    const { id } = await params;

    const { data: offer, error } = await supabase
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json(offer, { status: 200 });
  } catch (error) {
    console.error("API Error - Fetching offer:", error);
    return NextResponse.json(
      { error: "Failed to fetch offer" },
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

    // Filter body to only allowed fields
    const updateData: Record<string, any> = {};
    for (const key of ALLOWED_UPDATE_FIELDS) {
      if (key in body) {
        updateData[key] = body[key];
      }
    }

    // Reject if nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: "No valid fields provided for update" },
        { status: 400 },
      );
    }

    // Validate discount_percentage if present
    if (updateData.discount_percentage !== undefined) {
      const discount = parseFloat(updateData.discount_percentage);
      if (isNaN(discount) || discount < 0 || discount > 100) {
        return NextResponse.json(
          { error: "Discount must be between 0 and 100" },
          { status: 400 },
        );
      }
      updateData.discount_percentage = discount;
    }

    // Format dates if present
    if (updateData.valid_from) {
      updateData.valid_from = new Date(updateData.valid_from).toISOString();
    }
    if (updateData.valid_to) {
      updateData.valid_to = new Date(updateData.valid_to).toISOString();
    }

    const { data: updatedOffer, error } = await supabase
      .from("special_offers")
      .update(updateData)
      .eq("id", id)
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

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      }
      throw error;
    }

    await revalidatePage("/");

    return NextResponse.json(updatedOffer, { status: 200 });
  } catch (error) {
    console.error("API Error - Updating offer:", error);
    return NextResponse.json(
      { error: "Failed to update offer" },
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

    const { data: existing, error: fetchError } = await supabase
      .from("special_offers")
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    const { error } = await supabase
      .from("special_offers")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await revalidatePage("/");

    return NextResponse.json(
      { success: true, message: "Offer deleted" },
      { status: 200 },
    );
  } catch (error) {
    console.error("API Error - Deleting offer:", error);
    return NextResponse.json(
      { error: "Failed to delete offer" },
      { status: 500 },
    );
  }
}
