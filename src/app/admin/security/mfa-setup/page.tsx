'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import MFASetupWizard from '@/components/security/components/MFASetupWizard';
import type { MFAConfiguration } from '@/components/security/types/security.types';

export default function MFASetupPage() {
  const router = useRouter();
  
  // In a real app, this would come from authentication context
  const userId = process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '1';

  const handleComplete = (config: MFAConfiguration) => {
    // Redirect to security dashboard on completion
    router.push('/admin/security/dashboard');
  };

  const handleCancel = () => {
    // Go back to previous page or dashboard
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <MFASetupWizard
        userId={userId}
        onComplete={handleComplete}
        onCancel={handleCancel}
        allowedMethods={['totp', 'biometric_fingerprint', 'biometric_face', 'sms', 'email']}
        isRequired={false}
      />
    </div>
  );
} 