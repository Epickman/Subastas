// Sin dependencias de servidor: se usa también desde componentes cliente.
export const EXT_IMAGEN = ["jpg", "jpeg", "png", "webp", "gif"];
export const EXT_VIDEO = ["mp4", "webm", "mov", "m4v"];

export function extension(nombre: string): string {
  return nombre.split("?")[0].split(".").pop()?.toLowerCase() ?? "";
}

export function esVideo(url: string): boolean {
  return EXT_VIDEO.includes(extension(url));
}

// Lista de URLs válida a partir de lo que llega en el body de la API.
export function toGaleria(value: unknown): string[] {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}
