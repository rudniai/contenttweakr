import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Response ID is required" },
        { status: 400 }
      );
    }

    // Delete only if the user owns the response
    const { error: deleteError, count } = await supabase
      .from("generated_responses")
      .delete({ count: "exact" })
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("[responses/delete] Error:", deleteError);
      return NextResponse.json(
        { success: false, error: "Failed to delete response" },
        { status: 500 }
      );
    }

    if (count === 0) {
      return NextResponse.json(
        { success: false, error: "Response not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[responses/delete] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
