import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { isAdminToken } from "@/lib/auth";
import { EXT_IMAGEN, EXT_VIDEO, extension } from "@/lib/media";

export const dynamic = "force-dynamic";

// El navegador sube el archivo directo a Vercel Blob (los videos superan el
// límite de 4,5 MB de las funciones); esta ruta solo emite el token de subida.
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as HandleUploadBody;

    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const cookieStore = await cookies();
        if (!(await isAdminToken(cookieStore.get("admin_token")?.value))) {
          throw new Error("No autorizado");
        }
        const ext = extension(pathname);
        if (!pathname.startsWith("lotes/") || ![...EXT_IMAGEN, ...EXT_VIDEO].includes(ext)) {
          throw new Error("Formato no soportado");
        }
        return {
          allowedContentTypes: ["image/*", "video/*"],
          maximumSizeInBytes: 500 * 1024 * 1024,
          addRandomSuffix: false,
        };
      },
    });

    return NextResponse.json(result);
  } catch (e) {
    console.error("Error al subir archivo", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
