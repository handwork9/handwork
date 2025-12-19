'use client';

import AdminLayout from '@/components/AdminLayout';
import DashboardPage from './(dashboard)/page';

export default function Home() {
  return (
    <AdminLayout>
      <DashboardPage />
    </AdminLayout>
  );
}
