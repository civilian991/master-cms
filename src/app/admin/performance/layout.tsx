import React from 'react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    template: '%s | Performance Monitoring',
    default: 'Performance Monitoring',
  },
  description: 'Advanced performance monitoring and optimization dashboard',
};

interface PerformanceLayoutProps {
  children: React.ReactNode;
}

export default function PerformanceLayout({ children }: PerformanceLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col">
        {/* Header */}
        <header className="border-b bg-card">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Performance Monitoring
                </h1>
                <p className="text-sm text-muted-foreground">
                  Real-time performance analytics and optimization insights
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>Monitoring Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 container mx-auto px-6 py-6">
          {children}
        </main>
      </div>
    </div>
  );
} 