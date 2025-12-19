'use client';

import AdminLayout from '@/components/AdminLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Skip auth check for development
  return <AdminLayout>{children}</AdminLayout>;
}
