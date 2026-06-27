import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const propertyId = parseInt(id, 10);

    const db = await readDb();

    const data = db.reviews
      .filter((r) => r.propertyId === propertyId)
      .map((r) => {
        const property = db.properties.find((p) => p.id === r.propertyId);
        const reviewer = db.users.find((u) => u.id === r.userId);

        return {
          id: r.id,
          propertyId: r.propertyId,
          userId: r.userId,
          rating: r.rating,
          description: r.description,
          generatedAt: r.generatedAt,
          updatedAt: r.updatedAt,
          property: property ? { title: property.title } : { title: "Unknown Property" },
          user: reviewer ? { name: reviewer.name } : { name: "Anonymous" },
        };
      });

    return NextResponse.json({
      success: true,
      message: "Reviews retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET property reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
