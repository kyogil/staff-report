"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function Navbar() {
  const [user, setUser] = useState(null);
  const router = useRouter();

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/auth/session');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // If session is invalid, maybe redirect to login
          router.push('/login');
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
      }
    };
    fetchSession();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <nav className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/tasks" className="font-bold text-xl text-gray-800 dark:text-white">
              Buku Kontrol
            </Link>
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/tasks" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                Tugas Saya
              </Link>
              {user?.role === 'ADMIN' && (
                <Link href="/admin/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400">
                  Admin Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-gray-700 dark:text-gray-200">Welcome, {user.name}</span>
                <Button variant="outline" onClick={handleLogout}>Logout</Button>
              </>
            ) : (
              <div className="w-24 h-8 bg-gray-200 rounded animate-pulse"></div> // Skeleton loader
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
