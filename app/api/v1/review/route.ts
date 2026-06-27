import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb, Review } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const db = await readDb();

    // Map reviews with joins
    const data = db.reviews.map((r) => {
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
    console.error("GET reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "USER") {
      return NextResponse.json(
        { success: false, message: "Unauthorized. Buyer access required." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { rating, description, propertyId, userId } = body as {
      rating: number;
      description: string;
      propertyId: number;
      userId: string;
    };

    if (!rating || !description || !propertyId || !userId) {
      return NextResponse.json(
        { success: false, message: "Missing required review fields" },
        { status: 400 }
      );
    }

    const db = await readDb();

    const newReview: Review = {
      id: crypto.randomUUID(),
      propertyId,
      userId,
      rating,
      description,
      generatedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    db.reviews.push(newReview);

    // Create admin notification
    db.notifications.push({
      id: crypto.randomUUID(),
      title: "New Review Added",
      message: `${user.name} reviewed in ${db.properties.find((p) => p.id === propertyId)?.title || "a property"} property`,
      receiverId: null,
      receiverRole: "ADMIN",
      generatedAt: new Date().toISOString(),
    });

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Review added successfully",
      data: newReview,
    }, { status: 201 });
  } catch (error) {
    console.error("POST review error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
