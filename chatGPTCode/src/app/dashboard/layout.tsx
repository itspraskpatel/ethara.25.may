import { Sidebar } from '@/components/dashboard/Sidebar';
import { Navbar } from '@/components/dashboard/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background font-body">
      <Sidebar />
      <div className="lg:pl-64">
        <Navbar />
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}