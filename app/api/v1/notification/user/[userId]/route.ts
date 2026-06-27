import { NextRequest, NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { userId } = await params;
    const db = await readDb();

    // In NextJS agent has agentId and userId. A notification receiverId can be agentId or userId.
    const currentUser = db.users.find((u) => u.id === userId);
    const agentId = currentUser?.agentId;

    const userNotifications = db.notifications.filter(
      (n) => n.receiverId === userId || (agentId && n.receiverId === agentId)
    );

    return NextResponse.json({
      success: true,
      message: `Notification fetched Successfully for ${userId} id`,
      data: userNotifications,
    });
  } catch (error) {
    console.error("GET user notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
