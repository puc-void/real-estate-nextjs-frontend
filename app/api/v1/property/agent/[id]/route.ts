import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDb();

    // Find all properties listed by this agentId
    const agentProperties = db.properties.filter((prop) => prop.agentId === id);

    return NextResponse.json({
      success: true,
      message: "Properties retrieved successfully",
      data: agentProperties,
    });
  } catch (error) {
    console.error("GET agent properties error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
