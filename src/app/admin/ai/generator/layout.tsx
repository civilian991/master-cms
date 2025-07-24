import React from 'react';

export default function AIGeneratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="ai-generator-layout">
      {children}
    </div>
  );
} 