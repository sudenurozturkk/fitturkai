import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Footer from '@/components/layout/Footer';
import MotionLayout from '@/components/MotionLayout';
import ClientLayout from './ClientLayout';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'FitTurkAI - Sağlıklı Yaşam Takip Uygulaması',
  description:
    'Sağlıklı yaşam ve fitness hedeflerinize ulaşmanıza yardımcı olan kişisel sağlık takip uygulaması.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <div className="min-h-screen flex flex-col">
          <ClientLayout>
            <MotionLayout>{children}</MotionLayout>
          </ClientLayout>
          <Footer />
        </div>
      </body>
    </html>
  );
}
