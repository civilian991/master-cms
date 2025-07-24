import React from 'react';

export default function AnalyticsDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="analytics-dashboard-layout">
      {children}
    </div>
  );
} 