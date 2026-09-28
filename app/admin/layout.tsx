import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Admin — Subasta",
};

export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <div className="min-h-dvh" style={{ backgroundColor: "#080808" }}>
      <nav
        className="border-b px-4 sm:px-6 py-4 flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.07)", backgroundColor: "#0d0d0d" }}
      >
        <div className="flex items-center gap-6">
          <Link href="/admin">
            <Image
              src="/logo.png"
              alt="Logo"
              width={100}
              height={32}
              className="object-contain"
              style={{ maxHeight: 32 }}
            />
          </Link>
          <span style={{ color: "rgba(255,255,255,0.15)" }}>·</span>
          <Link href="/subasta" className="link-gold text-xs tracking-wider">
            Ver página pública ↗
          </Link>
        </div>
        <form action="/api/auth/logout" method="POST">
          <button type="submit" className="nav-logout">
            Cerrar sesión
          </button>
        </form>
      </nav>
      <div className="px-4 sm:px-6 py-8 max-w-5xl mx-auto">{children}</div>
    </div>
  );
}
