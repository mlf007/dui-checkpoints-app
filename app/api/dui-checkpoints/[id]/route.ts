import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Checkpoint, CheckpointError } from "@/lib/types/checkpoint";

interface SingleCheckpointResponse {
  success: boolean;
  checkpoint: Checkpoint;
}

/**
 * GET /api/dui-checkpoints/[id]
 *
 * Fetch a single DUI checkpoint by ID
 *
 * Example: /api/dui-checkpoints/1
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SingleCheckpointResponse | CheckpointError>> {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("Checkpoints")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return NextResponse.json(
          { error: "Checkpoint not found" },
          { status: 404 }
        );
      }
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch checkpoint", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      checkpoint: data as Checkpoint,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

