import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SecurityDashboard } from '@/components/security/components/SecurityDashboard';

// Mock the security API service
jest.mock('@/components/security/services/securityApi', () => ({
  securityApi: {
    checkSecurityStatus: jest.fn(() => Promise.resolve({
      mfaEnabled: true,
      biometricsEnabled: true,
      trustedDevices: 2,
      recentThreats: 0,
      riskLevel: 'low',
    })),
    getSecurityMetrics: jest.fn(() => Promise.resolve({
      totalEvents: 10,
      threatsBlocked: 0,
      successfulAuth: 25,
      failedAuth: 2,
      newDevices: 1,
      riskDistribution: {
        very_low: 8,
        low: 2,
        medium: 0,
        high: 0,
        critical: 0,
      },
      methodUsage: {
        totp: 15,
        biometric_fingerprint: 10,
      },
    })),
    getSecurityEvents: jest.fn(() => Promise.resolve([])),
    getUserDevices: jest.fn(() => Promise.resolve([
      {
        id: '1',
        fingerprint: 'device1',
        trustLevel: 'trusted',
        platform: 'Mac',
        browser: 'Chrome',
        lastSeen: new Date(),
      },
    ])),
    getMFAConfiguration: jest.fn(() => Promise.resolve({
      id: '1',
      userId: '1',
      enabledMethods: ['totp', 'biometric_fingerprint'],
      primaryMethod: 'totp',
      isRequired: true,
    })),
  },
}));

describe('SecurityDashboard', () => {
  const defaultProps = {
    userId: '1',
    timeRange: '7d',
    onTimeRangeChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders security dashboard', async () => {
    render(<SecurityDashboard {...defaultProps} />);
    
    expect(screen.getByText('Loading security dashboard...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Security Dashboard')).toBeInTheDocument();
    });
  });

  it('displays security overview cards', async () => {
    render(<SecurityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Security Score')).toBeInTheDocument();
      expect(screen.getByText('MFA Status')).toBeInTheDocument();
      expect(screen.getByText('Trusted Devices')).toBeInTheDocument();
      expect(screen.getByText('Threat Level')).toBeInTheDocument();
    });
  });

  it('shows MFA enabled status', async () => {
    render(<SecurityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Enabled')).toBeInTheDocument();
      expect(screen.getByText('2 methods configured')).toBeInTheDocument();
    });
  });

  it('displays correct risk level', async () => {
    render(<SecurityDashboard {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('LOW')).toBeInTheDocument();
      expect(screen.getByText('0 recent threats')).toBeInTheDocument();
    });
  });

  it('handles time range changes', async () => {
    const onTimeRangeChange = jest.fn();
    render(<SecurityDashboard {...defaultProps} onTimeRangeChange={onTimeRangeChange} />);
    
    await waitFor(() => {
      const select = screen.getByDisplayValue('Last 7 days');
      expect(select).toBeInTheDocument();
    });
  });
}); 