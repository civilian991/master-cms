import React from 'react';

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="search-layout">
      <div className="min-h-screen bg-background">
        {children}
      </div>
    </div>
  );
} 