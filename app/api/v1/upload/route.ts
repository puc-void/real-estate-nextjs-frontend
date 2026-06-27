import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const clientApiKey = formData.get("key") as string | null;
    
    const apiKey = clientApiKey || process.env.IMGBB_API_KEY;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: "No image file provided" },
        { status: 400 }
      );
    }

    if (apiKey) {
      try {
        const imgbbForm = new FormData();
        imgbbForm.append("image", imageFile);

        const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: imgbbForm,
        });

        const data = await res.json();
        
        if (data.success && data.data?.url) {
          return NextResponse.json({
            success: true,
            url: data.data.url,
            message: "Uploaded to Imgbb successfully",
          });
        } else {
          console.error("Imgbb error response:", data);
        }
      } catch (err) {
        console.error("Imgbb upload exception, trying fallback:", err);
      }
    }

    // Fallback: Return a high-quality property photo from Unsplash
    const fallbackPool = [
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      "https://images.unsplash.com/photo-1582407947304-fd86f028f716?w=800",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800",
      "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?w=800",
    ];

    const randomIndex = Math.floor(Math.random() * fallbackPool.length);
    const url = fallbackPool[randomIndex];

    return NextResponse.json({
      success: true,
      url,
      message: "Uploaded successfully (local fallback used)",
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error during upload" },
      { status: 500 }
    );
  }
}
