"use client";

// Reproductor con controles que no deja activar el sonido (por si el video subido tiene audio).
export default function VideoMudo({ src }: { src: string }) {
  return (
    <video
      src={src}
      controls
      muted
      playsInline
      preload="metadata"
      onVolumeChange={e => {
        e.currentTarget.muted = true;
      }}
      className="absolute inset-0 w-full h-full object-contain"
    />
  );
}
