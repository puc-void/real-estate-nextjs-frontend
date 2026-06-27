import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, image, contactNumber, address } = body as {
      name?: string;
      image?: string;
      contactNumber?: string;
      address?: string;
    };

    const db = await readDb();
    const user = db.users.find((u) => u.id === id);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    if (name) user.name = name;
    if (image) user.imageUrl = image;
    if (contactNumber) user.contactNumber = contactNumber;
    if (address) user.address = address;
    user.updatedAt = new Date().toISOString();

    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user.id,
        name: user.name,
        image: user.imageUrl,
        contactNumber: user.contactNumber || "",
        address: user.address || "",
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
