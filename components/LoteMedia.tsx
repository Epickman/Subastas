import Image from "next/image";
import { esVideo } from "@/lib/media";
import VideoMudo from "./VideoMudo";

type LoteMediaProps = {
  src: string;
  alt: string;
  sizes: string;
  // Siempre sin sonido; con controles en el detalle y en loop en grillas y miniaturas.
  controls?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function LoteMedia({ src, alt, sizes, controls, priority, unoptimized }: LoteMediaProps) {
  if (esVideo(src)) {
    return controls ? (
      <VideoMudo src={src} />
    ) : (
      <video src={src} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
    );
  }
  return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} unoptimized={unoptimized} />;
}
