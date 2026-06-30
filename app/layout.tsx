import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FinancePro — Finanzas para Freelancers',
  description: 'Gestiona tus ingresos, gastos y suscripciones como freelancer con FinancePro.',
  keywords: ['finanzas', 'freelancer', 'suscripciones', 'ingresos', 'gastos'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
