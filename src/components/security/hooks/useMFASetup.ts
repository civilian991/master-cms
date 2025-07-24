'use client';

import { useState, useCallback, useEffect } from 'react';
import { securityApi } from '../services/securityApi';
import { biometricAuth } from '../services/biometricAuth';
import { deviceManager } from '../services/deviceManager';
import {
  MFAConfiguration,
  AuthenticationMethod,
  BiometricType,
  MFASetupRequest,
  MFASetupResponse,
  RecoveryCode,
  UseMFASetupOptions,
} from '../types/security.types';

interface MFASetupStep {
  id: string;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isOptional: boolean;
  data?: any;
}

interface MFASetupState {
  isLoading: boolean;
  currentStep: number;
  steps: MFASetupStep[];
  error: string | null;
  mfaConfig: MFAConfiguration | null;
  backupCodes: string[];
  qrCode: string | null;
  setupToken: string | null;
  selectedMethods: AuthenticationMethod[];
  primaryMethod: AuthenticationMethod | null;
  biometricCapabilities: any;
}

export function useMFASetup(
  userId: string,
  options: UseMFASetupOptions = {}
) {
  const {
    autoSave = true,
    validateStrength = true,
    allowedMethods = ['totp', 'biometric_fingerprint', 'biometric_face', 'sms', 'email'],
  } = options;

  const [state, setState] = useState<MFASetupState>({
    isLoading: false,
    currentStep: 0,
    steps: [],
    error: null,
    mfaConfig: null,
    backupCodes: [],
    qrCode: null,
    setupToken: null,
    selectedMethods: [],
    primaryMethod: null,
    biometricCapabilities: null,
  });

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  const initializeSetup = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Check existing MFA configuration
      const existingConfig = await securityApi.getMFAConfiguration(userId);

      // Get biometric capabilities
      const capabilities = await biometricAuth.getBiometricCapabilities();

      // Create setup steps based on allowed methods and capabilities
      const steps = createSetupSteps(allowedMethods, capabilities, existingConfig);

      setState(prev => ({
        ...prev,
        steps,
        biometricCapabilities: capabilities,
        mfaConfig: existingConfig,
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to initialize MFA setup',
        isLoading: false,
      }));
    }
  }, [userId, allowedMethods]);

  const createSetupSteps = (
    methods: AuthenticationMethod[],
    capabilities: any,
    existingConfig: MFAConfiguration | null
  ): MFASetupStep[] => {
    const steps: MFASetupStep[] = [
      {
        id: 'welcome',
        title: 'Welcome to MFA Setup',
        description: 'Secure your account with multi-factor authentication',
        component: 'WelcomeStep',
        isComplete: false,
        isOptional: false,
      },
      {
        id: 'method-selection',
        title: 'Choose Authentication Methods',
        description: 'Select your preferred authentication methods',
        component: 'MethodSelectionStep',
        isComplete: false,
        isOptional: false,
      },
    ];

    // Add method-specific setup steps
    if (methods.includes('totp')) {
      steps.push({
        id: 'totp-setup',
        title: 'Authenticator App Setup',
        description: 'Set up your authenticator app',
        component: 'TOTPSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    if (methods.includes('biometric_fingerprint') && capabilities.fingerprint) {
      steps.push({
        id: 'fingerprint-setup',
        title: 'Fingerprint Setup',
        description: 'Register your fingerprint for biometric authentication',
        component: 'FingerprintSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    if (methods.includes('biometric_face') && capabilities.face) {
      steps.push({
        id: 'face-setup',
        title: 'Face Recognition Setup',
        description: 'Register your face for biometric authentication',
        component: 'FaceSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    if (methods.includes('biometric_voice') && capabilities.voice) {
      steps.push({
        id: 'voice-setup',
        title: 'Voice Authentication Setup',
        description: 'Register your voice for authentication',
        component: 'VoiceSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    if (methods.includes('sms')) {
      steps.push({
        id: 'sms-setup',
        title: 'SMS Setup',
        description: 'Add your phone number for SMS authentication',
        component: 'SMSSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    if (methods.includes('email')) {
      steps.push({
        id: 'email-setup',
        title: 'Email Setup',
        description: 'Configure email-based authentication',
        component: 'EmailSetupStep',
        isComplete: false,
        isOptional: true,
      });
    }

    steps.push(
      {
        id: 'backup-codes',
        title: 'Backup Codes',
        description: 'Generate and save your backup recovery codes',
        component: 'BackupCodesStep',
        isComplete: false,
        isOptional: false,
      },
      {
        id: 'confirmation',
        title: 'Setup Complete',
        description: 'Review your MFA configuration',
        component: 'ConfirmationStep',
        isComplete: false,
        isOptional: false,
      }
    );

    return steps;
  };

  // ============================================================================
  // STEP NAVIGATION
  // ============================================================================

  const nextStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.min(prev.currentStep + 1, prev.steps.length - 1);
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const previousStep = useCallback(() => {
    setState(prev => {
      const newStep = Math.max(prev.currentStep - 1, 0);
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const goToStep = useCallback((stepIndex: number) => {
    setState(prev => {
      const newStep = Math.max(0, Math.min(stepIndex, prev.steps.length - 1));
      return { ...prev, currentStep: newStep };
    });
  }, []);

  const markStepComplete = useCallback((stepId: string, data?: any) => {
    setState(prev => ({
      ...prev,
      steps: prev.steps.map(step =>
        step.id === stepId
          ? { ...step, isComplete: true, data }
          : step
      ),
    }));

    if (autoSave) {
      // Auto-save progress to localStorage
      localStorage.setItem(
        `mfa-setup-${userId}`,
        JSON.stringify({
          currentStep: state.currentStep,
          completedSteps: state.steps.filter(s => s.isComplete).map(s => s.id),
          data: state.steps.find(s => s.id === stepId)?.data,
        })
      );
    }
  }, [autoSave, userId, state.currentStep, state.steps]);

  // ============================================================================
  // METHOD SETUP FUNCTIONS
  // ============================================================================

  const setupTOTP = useCallback(async (): Promise<{ qrCode: string; secret: string }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = await deviceManager.getDeviceInfo();
      const request: MFASetupRequest = {
        method: 'totp',
        deviceInfo,
      };

      const response = await securityApi.setupMFA(request);
      
      setState(prev => ({
        ...prev,
        qrCode: response.qrCode || null,
        setupToken: response.setupToken || null,
        isLoading: false,
      }));

      markStepComplete('totp-setup', { qrCode: response.qrCode });

      return {
        qrCode: response.qrCode || '',
        secret: response.setupToken || '',
      };
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'TOTP setup failed',
        isLoading: false,
      }));
      throw error;
    }
  }, [markStepComplete]);

  const setupBiometric = useCallback(async (type: BiometricType): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      let credentialData;

      switch (type) {
        case 'fingerprint':
          credentialData = await biometricAuth.enrollWebAuthn({
            userId,
            userName: `user-${userId}`,
            userDisplayName: `User ${userId}`,
            authenticatorAttachment: 'platform',
          });
          break;

        case 'face':
          const faceData = await biometricAuth.enrollFace(userId);
          credentialData = faceData;
          break;

        case 'voice':
          const voiceData = await biometricAuth.enrollVoice(userId);
          credentialData = voiceData;
          break;

        default:
          throw new Error(`Unsupported biometric type: ${type}`);
      }

      const deviceInfo = await deviceManager.getDeviceInfo();
      const request: MFASetupRequest = {
        method: `biometric_${type}` as AuthenticationMethod,
        deviceInfo,
        biometricData: {
          type,
          credentialData,
        },
      };

      const response = await securityApi.setupMFA(request);
      
      markStepComplete(`${type}-setup`, { credentialData });
      
      setState(prev => ({
        ...prev,
        selectedMethods: [...prev.selectedMethods, `biometric_${type}` as AuthenticationMethod],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : `${type} setup failed`,
        isLoading: false,
      }));
      throw error;
    }
  }, [userId, markStepComplete]);

  const setupSMS = useCallback(async (phoneNumber: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = await deviceManager.getDeviceInfo();
      const request: MFASetupRequest = {
        method: 'sms',
        deviceInfo,
      };

      // In a real implementation, this would send an SMS verification
      const response = await securityApi.setupMFA(request);
      
      markStepComplete('sms-setup', { phoneNumber });
      
      setState(prev => ({
        ...prev,
        selectedMethods: [...prev.selectedMethods, 'sms'],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'SMS setup failed',
        isLoading: false,
      }));
      throw error;
    }
  }, [markStepComplete]);

  const setupEmail = useCallback(async (email: string): Promise<void> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const deviceInfo = await deviceManager.getDeviceInfo();
      const request: MFASetupRequest = {
        method: 'email',
        deviceInfo,
      };

      // In a real implementation, this would send an email verification
      const response = await securityApi.setupMFA(request);
      
      markStepComplete('email-setup', { email });
      
      setState(prev => ({
        ...prev,
        selectedMethods: [...prev.selectedMethods, 'email'],
        isLoading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Email setup failed',
        isLoading: false,
      }));
      throw error;
    }
  }, [markStepComplete]);

  const generateBackupCodes = useCallback(async (): Promise<string[]> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const codes = await securityApi.generateRecoveryCodes(userId);
      const codeStrings = codes.map(code => code.code);
      
      setState(prev => ({
        ...prev,
        backupCodes: codeStrings,
        isLoading: false,
      }));

      markStepComplete('backup-codes', { codes: codeStrings });
      
      return codeStrings;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to generate backup codes',
        isLoading: false,
      }));
      throw error;
    }
  }, [userId, markStepComplete]);

  // ============================================================================
  // CONFIGURATION MANAGEMENT
  // ============================================================================

  const setPrimaryMethod = useCallback((method: AuthenticationMethod) => {
    setState(prev => ({ ...prev, primaryMethod: method }));
  }, []);

  const addMethod = useCallback((method: AuthenticationMethod) => {
    setState(prev => ({
      ...prev,
      selectedMethods: prev.selectedMethods.includes(method)
        ? prev.selectedMethods
        : [...prev.selectedMethods, method],
    }));
  }, []);

  const removeMethod = useCallback((method: AuthenticationMethod) => {
    setState(prev => ({
      ...prev,
      selectedMethods: prev.selectedMethods.filter(m => m !== method),
      primaryMethod: prev.primaryMethod === method ? null : prev.primaryMethod,
    }));
  }, []);

  const completeMFASetup = useCallback(async (): Promise<MFAConfiguration> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      if (!state.primaryMethod) {
        throw new Error('Primary authentication method must be selected');
      }

      if (state.selectedMethods.length === 0) {
        throw new Error('At least one authentication method must be selected');
      }

      // Create final MFA configuration
      const config: Partial<MFAConfiguration> = {
        userId,
        enabledMethods: state.selectedMethods,
        primaryMethod: state.primaryMethod,
        backupMethods: state.selectedMethods.filter(m => m !== state.primaryMethod),
        isRequired: true,
      };

      const updatedConfig = await securityApi.updateMFAConfiguration(userId, config);
      
      setState(prev => ({
        ...prev,
        mfaConfig: updatedConfig,
        isLoading: false,
      }));

      markStepComplete('confirmation', { config: updatedConfig });

      // Clear setup progress from localStorage
      localStorage.removeItem(`mfa-setup-${userId}`);

      return updatedConfig;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to complete MFA setup',
        isLoading: false,
      }));
      throw error;
    }
  }, [userId, state.selectedMethods, state.primaryMethod, markStepComplete]);

  // ============================================================================
  // VALIDATION
  // ============================================================================

  const validateCurrentStep = useCallback((): boolean => {
    const currentStepData = state.steps[state.currentStep];
    if (!currentStepData) return false;

    switch (currentStepData.id) {
      case 'method-selection':
        return state.selectedMethods.length > 0 && state.primaryMethod !== null;
      
      case 'totp-setup':
        return !state.selectedMethods.includes('totp') || currentStepData.isComplete;
      
      case 'fingerprint-setup':
        return !state.selectedMethods.includes('biometric_fingerprint') || currentStepData.isComplete;
      
      case 'face-setup':
        return !state.selectedMethods.includes('biometric_face') || currentStepData.isComplete;
      
      case 'voice-setup':
        return !state.selectedMethods.includes('biometric_voice') || currentStepData.isComplete;
      
      case 'sms-setup':
        return !state.selectedMethods.includes('sms') || currentStepData.isComplete;
      
      case 'email-setup':
        return !state.selectedMethods.includes('email') || currentStepData.isComplete;
      
      case 'backup-codes':
        return state.backupCodes.length > 0;
      
      default:
        return true;
    }
  }, [state.steps, state.currentStep, state.selectedMethods, state.primaryMethod, state.backupCodes]);

  const canProceed = useCallback((): boolean => {
    return validateCurrentStep() && !state.isLoading;
  }, [validateCurrentStep, state.isLoading]);

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  const resetSetup = useCallback(() => {
    setState(prev => ({
      ...prev,
      currentStep: 0,
      steps: prev.steps.map(step => ({ ...step, isComplete: false, data: undefined })),
      selectedMethods: [],
      primaryMethod: null,
      backupCodes: [],
      qrCode: null,
      setupToken: null,
      error: null,
    }));
    
    localStorage.removeItem(`mfa-setup-${userId}`);
  }, [userId]);

  const getProgress = useCallback((): number => {
    const completedSteps = state.steps.filter(step => step.isComplete).length;
    return (completedSteps / state.steps.length) * 100;
  }, [state.steps]);

  const getCurrentStepInfo = useCallback(() => {
    return state.steps[state.currentStep] || null;
  }, [state.steps, state.currentStep]);

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    initializeSetup();
  }, [initializeSetup]);

  // Load saved progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem(`mfa-setup-${userId}`);
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setState(prev => ({
          ...prev,
          currentStep: progress.currentStep || 0,
          steps: prev.steps.map(step => ({
            ...step,
            isComplete: progress.completedSteps?.includes(step.id) || false,
            data: progress.data || step.data,
          })),
        }));
      } catch (error) {
        console.warn('Failed to load MFA setup progress:', error);
      }
    }
  }, [userId]);

  return {
    // State
    ...state,
    
    // Navigation
    nextStep,
    previousStep,
    goToStep,
    markStepComplete,
    
    // Setup functions
    setupTOTP,
    setupBiometric,
    setupSMS,
    setupEmail,
    generateBackupCodes,
    
    // Configuration
    setPrimaryMethod,
    addMethod,
    removeMethod,
    completeMFASetup,
    
    // Validation
    validateCurrentStep,
    canProceed,
    
    // Utilities
    resetSetup,
    getProgress,
    getCurrentStepInfo,
    initializeSetup,
  };
}

export default useMFASetup; 