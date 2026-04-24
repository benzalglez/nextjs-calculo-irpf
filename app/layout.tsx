import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Auditoría integral de nóminas e inflación",
  description:
    "Onepage interactiva para analizar salario bruto, cotizaciones, IRPF, neto e inflación 2012-2026.",
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
