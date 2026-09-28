import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: RouteContext<"/api/img/[filename]">) {
  const { filename } = await ctx.params;

  const safeName = path.basename(filename);
  const filepath = path.join(process.cwd(), "public", "uploads", safeName);

  if (!fs.existsSync(filepath)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = fs.readFileSync(filepath);
  const ext = safeName.split(".").pop()?.toLowerCase() ?? "jpg";
  const contentType =
    ext === "png" ? "image/png" :
    ext === "webp" ? "image/webp" :
    ext === "gif" ? "image/gif" :
    "image/jpeg";

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
