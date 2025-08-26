import '@/app/globals.css';
import { Providers } from '@/components/Providers';

export const metadata = {
  title: 'Pokémon Auto Battle',
  description: 'Auto‑battle game using the first 150 Pokémon.'
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}