// Solo cliente: quita la pista de audio de un video con ffmpeg.wasm antes de subirlo.
// Copia el video sin recodificar (-c copy), así que es rápido aun con archivos grandes.
import type { FFmpeg } from "@ffmpeg/ffmpeg";

const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.10/dist/esm";

let ffmpegPromise: Promise<FFmpeg> | null = null;

function cargarFFmpeg(): Promise<FFmpeg> {
  ffmpegPromise ??= (async () => {
    const [{ FFmpeg }, { toBlobURL }] = await Promise.all([
      import("@ffmpeg/ffmpeg"),
      import("@ffmpeg/util"),
    ]);
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      // Worker sin bundlear (lo copia el postinstall): Turbopack no soporta su import() dinámico.
      classWorkerURL: `${location.origin}/ffmpeg/worker.js`,
      coreURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.js`, "text/javascript"),
      wasmURL: await toBlobURL(`${CORE_BASE}/ffmpeg-core.wasm`, "application/wasm"),
    });
    return ffmpeg;
  })().catch(e => {
    ffmpegPromise = null;
    throw e;
  });
  return ffmpegPromise;
}

export async function quitarAudio(file: File, ext: string): Promise<File> {
  const ffmpeg = await cargarFFmpeg();
  const dir = "/entrada";
  const salida = `salida.${ext}`;

  // WORKERFS lee el archivo directo del File, sin copiarlo entero a memoria.
  await ffmpeg.createDir(dir);
  await ffmpeg.mount("WORKERFS" as never, { files: [file] }, dir);
  try {
    const args = ["-i", `${dir}/${file.name}`, "-map", "0:v", "-an", "-c", "copy"];
    if (ext !== "webm") args.push("-movflags", "+faststart");
    const codigo = await ffmpeg.exec([...args, salida]);
    if (codigo !== 0) throw new Error("ffmpeg falló");

    const data = (await ffmpeg.readFile(salida)) as Uint8Array<ArrayBuffer>;
    await ffmpeg.deleteFile(salida);
    return new File([data], file.name, { type: file.type });
  } finally {
    await ffmpeg.unmount(dir);
    await ffmpeg.deleteDir(dir);
  }
}
