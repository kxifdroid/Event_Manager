import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="min-h-[calc(100vh-8rem)] p-4 lg:p-8">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
