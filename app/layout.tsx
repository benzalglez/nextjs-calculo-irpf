import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "IRPF LAB | Nómina, coste laboral e inflación",
  description:
    "Laboratorio salarial para abrir una nómina: coste empresa, cotizaciones, IRPF, neto e inflación 2012-2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
