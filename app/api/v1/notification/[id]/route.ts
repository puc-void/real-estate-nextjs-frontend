import { NextRequest, NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user || user.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const db = await readDb();
    const notificationIndex = db.notifications.findIndex((n) => n.id === id);

    if (notificationIndex === -1) {
      return NextResponse.json(
        { success: false, message: "Notification not found" },
        { status: 404 }
      );
    }

    const deleted = db.notifications[notificationIndex];
    db.notifications.splice(notificationIndex, 1);
    await writeDb(db);

    return NextResponse.json({
      success: true,
      message: "Notification deleted successfully",
      data: deleted,
    });
  } catch (error) {
    console.error("DELETE notification error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
