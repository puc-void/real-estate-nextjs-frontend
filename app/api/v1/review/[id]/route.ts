import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await readDb();
    const r = db.reviews.find((item) => item.id === id);

    if (!r) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    const property = db.properties.find((p) => p.id === r.propertyId);
    const reviewer = db.users.find((u) => u.id === r.userId);

    const data = {
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

    return NextResponse.json({
      success: true,
      message: "Review details retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("GET review detail error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const { rating, description } = body as { rating?: number; description?: string };

    const db = await readDb();
    const r = db.reviews.find((item) => item.id === id);

    if (!r) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    // Only creator can edit
    if (r.userId !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized. You did not write this review." },
        { status: 403 }
      );
    }

    if (rating !== undefined) r.rating = rating;
    if (description !== undefined) r.description = description;
    r.updatedAt = new Date().toISOString();

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Review updated successfully",
      data: {
        id: r.id,
        propertyId: r.propertyId,
        userId: r.userId,
        rating: r.rating,
        description: r.description,
        generatedAt: r.generatedAt,
        updatedAt: r.updatedAt,
      },
    });
  } catch (error) {
    console.error("PUT review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = await readDb();
    const index = db.reviews.findIndex((item) => item.id === id);

    if (index === -1) {
      return NextResponse.json(
        { success: false, message: "Review not found" },
        { status: 404 }
      );
    }

    const r = db.reviews[index];

    // Creator or Admin can delete
    if (r.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this review." },
        { status: 403 }
      );
    }

    db.reviews.splice(index, 1);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Review deleted successfully",
      data: {
        id: r.id,
        propertyId: r.propertyId,
        userId: r.userId,
        rating: r.rating,
        description: r.description,
        generatedAt: r.generatedAt,
      },
    });
  } catch (error) {
    console.error("DELETE review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
