import Navbar from '@/components/Navbar';

export default function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Navbar />
      <main>
        {children}
      </main>
    </div>
  );
}
