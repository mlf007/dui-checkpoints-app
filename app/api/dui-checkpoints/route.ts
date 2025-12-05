import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import type { Checkpoint, CheckpointResponse, CheckpointError } from "@/lib/types/checkpoint";

// CORS headers for embed script access
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/dui-checkpoints
 *
 * Fetch DUI checkpoints with optional filtering
 *
 * Query Parameters:
 * - state: Filter by state (e.g., "CA")
 * - city: Filter by city (partial match)
 * - county: Filter by county (partial match)
 * - upcoming: Set to "true" to only show future checkpoints
 *
 * Example: /api/dui-checkpoints?state=CA&upcoming=true
 */
export async function GET(request: NextRequest): Promise<NextResponse<CheckpointResponse | CheckpointError>> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    // Optional query parameters for filtering
    const state = searchParams.get("state");
    const city = searchParams.get("city");
    const county = searchParams.get("county");
    const upcoming = searchParams.get("upcoming");

    // Start building the query
    let query = supabase
      .from("Checkpoints")
      .select("*")
      .order("Date", { ascending: true });

    // Apply filters if provided
    if (state) {
      query = query.ilike("State", state);
    }

    if (city) {
      query = query.ilike("City", `%${city}%`);
    }

    if (county) {
      query = query.ilike("County", `%${county}%`);
    }

    // Filter for upcoming checkpoints only (date >= today)
    if (upcoming === "true") {
      const today = new Date().toISOString().split("T")[0];
      query = query.gte("Date", today);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch checkpoints", details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      count: data?.length ?? 0,
      checkpoints: data as Checkpoint[],
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

