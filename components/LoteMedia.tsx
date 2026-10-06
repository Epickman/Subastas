import Image from "next/image";
import { esVideo } from "@/lib/media";

type LoteMediaProps = {
  src: string;
  alt: string;
  sizes: string;
  // Con controles en el detalle; en grillas y miniaturas, en loop sin sonido.
  controls?: boolean;
  priority?: boolean;
  unoptimized?: boolean;
};

export default function LoteMedia({ src, alt, sizes, controls, priority, unoptimized }: LoteMediaProps) {
  if (esVideo(src)) {
    return controls ? (
      <video src={src} controls playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
    ) : (
      <video src={src} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 w-full h-full object-cover" />
    );
  }
  return <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} priority={priority} unoptimized={unoptimized} />;
}
