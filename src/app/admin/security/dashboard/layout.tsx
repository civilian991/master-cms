import React from 'react';

export default function SecurityDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-6">
        {children}
      </div>
    </div>
  );
} 