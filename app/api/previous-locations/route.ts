import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface PreviousLocation {
  id: string;
  checkpoint_id: number;
  county: string | null;
  city: string | null;
  location: string;
  mapurl: string | null;
  created_at: string;
}

interface PreviousLocationsResponse {
  success: boolean;
  count: number;
  locations: PreviousLocation[];
}

interface PreviousLocationsError {
  error: string;
  details?: string;
}

// Reuse the same CORS settings as /api/dui-checkpoints
const corsHeaders = {
  "Access-Control-Allow-Origin":
    "https://themeehanlawfirm.com, https://meehanlawdui-checkpoints.rork.app, https://rork.com",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle OPTIONS request for CORS preflight
export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * GET /api/previous-locations?checkpointId=1
 *
 * Fetch previous locations for a given checkpoint.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<PreviousLocationsResponse | PreviousLocationsError>> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const checkpointIdParam = searchParams.get("checkpointId");

    if (!checkpointIdParam) {
      return NextResponse.json(
        { error: "Missing required query parameter: checkpointId" },
        { status: 400, headers: corsHeaders }
      );
    }

    const checkpointId = Number(checkpointIdParam);

    if (Number.isNaN(checkpointId)) {
      return NextResponse.json(
        { error: "Invalid checkpointId, must be a number" },
        { status: 400, headers: corsHeaders }
      );
    }

    const { data, error } = await supabase
      .from("previous_locations")
      .select("*")
      .eq("checkpoint_id", checkpointId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch previous locations", details: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        success: true,
        count: data?.length ?? 0,
        locations: (data ?? []) as PreviousLocation[],
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500, headers: corsHeaders }
    );
  }
}

