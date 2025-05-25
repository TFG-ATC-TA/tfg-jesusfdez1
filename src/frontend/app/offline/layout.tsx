import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sin conexión',
  description: 'Aplicación no disponible - Lactokeeper requiere conexión a internet',
};

export default function OfflineLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="offline-layout">
      {children}
    </div>
  );
}
