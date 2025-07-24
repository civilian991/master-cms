'use client';

import {
  BiometricType,
  BiometricCapabilities,
  AuthenticationResponse,
  SecurityRiskLevel,
} from '../types/security.types';

export interface BiometricAuthOptions {
  timeout?: number;
  userVerification?: 'required' | 'preferred' | 'discouraged';
  authenticatorAttachment?: 'platform' | 'cross-platform';
  requireResidentKey?: boolean;
}

export interface BiometricEnrollmentOptions extends BiometricAuthOptions {
  userName: string;
  userDisplayName: string;
  userId: string;
}

export interface BiometricCredentialInfo {
  id: string;
  rawId: ArrayBuffer;
  type: 'public-key';
  response: {
    clientDataJSON: ArrayBuffer;
    attestationObject?: ArrayBuffer;
    authenticatorData?: ArrayBuffer;
    signature?: ArrayBuffer;
    userHandle?: ArrayBuffer;
  };
}

export interface VoiceAuthOptions {
  duration?: number;
  sampleRate?: number;
  channels?: number;
  passphrase?: string;
}

export interface FaceAuthOptions {
  video?: boolean;
  photo?: boolean;
  confidence?: number;
}

class BiometricAuthService {
  private isWebAuthnSupported: boolean;
  private mediaDevices: MediaDevices | null;

  constructor() {
    this.isWebAuthnSupported = this.checkWebAuthnSupport();
    this.mediaDevices = typeof navigator !== 'undefined' ? navigator.mediaDevices : null;
  }

  // ============================================================================
  // CAPABILITY DETECTION
  // ============================================================================

  private checkWebAuthnSupport(): boolean {
    return !!(
      typeof window !== 'undefined' &&
      window.PublicKeyCredential &&
      navigator.credentials &&
      navigator.credentials.create &&
      navigator.credentials.get
    );
  }

  async getBiometricCapabilities(): Promise<BiometricCapabilities> {
    const capabilities: BiometricCapabilities = {
      fingerprint: false,
      face: false,
      voice: false,
      iris: false,
      palm: false,
      hardwareKey: false,
      platform: typeof navigator !== 'undefined' ? navigator.platform : 'unknown',
    };

    // Check WebAuthn support for fingerprint and hardware keys
    if (this.isWebAuthnSupported) {
      try {
        // Check if platform authenticator is available (Touch ID, Face ID, Windows Hello)
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        capabilities.fingerprint = available;
        capabilities.hardwareKey = true;

        // On some platforms, platform authenticators support face recognition
        if (available && (navigator.platform.includes('Mac') || navigator.platform.includes('Win'))) {
          capabilities.face = true;
        }
      } catch (error) {
        console.warn('Error checking platform authenticator availability:', error);
      }
    }

    // Check camera access for face recognition
    if (this.mediaDevices) {
      try {
        const devices = await this.mediaDevices.enumerateDevices();
        const hasCamera = devices.some(device => device.kind === 'videoinput');
        if (hasCamera) {
          capabilities.face = true;
        }
      } catch (error) {
        console.warn('Error checking camera availability:', error);
      }
    }

    // Check microphone access for voice recognition
    if (this.mediaDevices) {
      try {
        const devices = await this.mediaDevices.enumerateDevices();
        const hasMicrophone = devices.some(device => device.kind === 'audioinput');
        if (hasMicrophone) {
          capabilities.voice = true;
        }
      } catch (error) {
        console.warn('Error checking microphone availability:', error);
      }
    }

    return capabilities;
  }

  // ============================================================================
  // WEBAUTHN AUTHENTICATION (Fingerprint, Face ID, Windows Hello)
  // ============================================================================

  async enrollWebAuthn(
    options: BiometricEnrollmentOptions
  ): Promise<BiometricCredentialInfo> {
    if (!this.isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = this.generateChallenge();
    const userIdBuffer = new TextEncoder().encode(options.userId);

    const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: process.env.NEXT_PUBLIC_APP_NAME || 'Master CMS',
        id: process.env.NEXT_PUBLIC_DOMAIN || 'localhost',
      },
      user: {
        id: userIdBuffer,
        name: options.userName,
        displayName: options.userDisplayName,
      },
      pubKeyCredParams: [
        { alg: -7, type: 'public-key' }, // ES256
        { alg: -257, type: 'public-key' }, // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: options.authenticatorAttachment || 'platform',
        userVerification: options.userVerification || 'required',
        requireResidentKey: options.requireResidentKey || false,
      },
      timeout: options.timeout || 60000,
      attestation: 'direct',
    };

    try {
      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Failed to create credential');
      }

      return {
        id: credential.id,
        rawId: credential.rawId,
        type: credential.type as 'public-key',
        response: {
          clientDataJSON: (credential.response as AuthenticatorAttestationResponse).clientDataJSON,
          attestationObject: (credential.response as AuthenticatorAttestationResponse).attestationObject,
        },
      };
    } catch (error) {
      this.handleWebAuthnError(error);
      throw error;
    }
  }

  async authenticateWebAuthn(
    credentialIds: string[],
    options: BiometricAuthOptions = {}
  ): Promise<BiometricCredentialInfo> {
    if (!this.isWebAuthnSupported) {
      throw new Error('WebAuthn is not supported in this browser');
    }

    const challenge = this.generateChallenge();
    const allowCredentials = credentialIds.map(id => ({
      id: this.base64ToArrayBuffer(id),
      type: 'public-key' as const,
    }));

    const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials,
      timeout: options.timeout || 60000,
      userVerification: options.userVerification || 'required',
    };

    try {
      const credential = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions,
      }) as PublicKeyCredential;

      if (!credential) {
        throw new Error('Authentication failed or was cancelled');
      }

      return {
        id: credential.id,
        rawId: credential.rawId,
        type: credential.type as 'public-key',
        response: {
          clientDataJSON: (credential.response as AuthenticatorAssertionResponse).clientDataJSON,
          authenticatorData: (credential.response as AuthenticatorAssertionResponse).authenticatorData,
          signature: (credential.response as AuthenticatorAssertionResponse).signature,
          userHandle: (credential.response as AuthenticatorAssertionResponse).userHandle,
        },
      };
    } catch (error) {
      this.handleWebAuthnError(error);
      throw error;
    }
  }

  // ============================================================================
  // VOICE AUTHENTICATION
  // ============================================================================

  async enrollVoice(
    userId: string,
    options: VoiceAuthOptions = {}
  ): Promise<{ audioData: Blob; features: number[] }> {
    if (!this.mediaDevices) {
      throw new Error('Media devices not supported');
    }

    const {
      duration = 5000,
      sampleRate = 16000,
      channels = 1,
      passphrase = 'The quick brown fox jumps over the lazy dog',
    } = options;

    try {
      const stream = await this.mediaDevices.getUserMedia({
        audio: {
          sampleRate,
          channelCount: channels,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      return new Promise((resolve, reject) => {
        mediaRecorder.ondataavailable = (event) => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach(track => track.stop());
          const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
          
          // Extract basic audio features (placeholder - would use proper audio analysis in production)
          const features = this.extractVoiceFeatures(audioBlob);
          
          resolve({ audioData: audioBlob, features });
        };

        mediaRecorder.onerror = (event) => {
          stream.getTracks().forEach(track => track.stop());
          reject(new Error('Voice recording failed'));
        };

        mediaRecorder.start();
        setTimeout(() => {
          if (mediaRecorder.state === 'recording') {
            mediaRecorder.stop();
          }
        }, duration);
      });
    } catch (error) {
      throw new Error(`Voice enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticateVoice(
    enrollmentFeatures: number[],
    options: VoiceAuthOptions = {}
  ): Promise<{ confidence: number; features: number[] }> {
    const { audioData, features } = await this.enrollVoice('temp', options);
    
    // Compare voice features (placeholder - would use proper voice matching in production)
    const confidence = this.compareVoiceFeatures(enrollmentFeatures, features);
    
    return { confidence, features };
  }

  // ============================================================================
  // FACE AUTHENTICATION
  // ============================================================================

  async enrollFace(
    userId: string,
    options: FaceAuthOptions = {}
  ): Promise<{ imageData: Blob; features: number[] }> {
    if (!this.mediaDevices) {
      throw new Error('Media devices not supported');
    }

    try {
      const stream = await this.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
      });

      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      video.srcObject = stream;
      await video.play();

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);

      stream.getTracks().forEach(track => track.stop());

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            // Extract basic face features (placeholder - would use proper face analysis in production)
            const features = this.extractFaceFeatures(blob);
            resolve({ imageData: blob, features });
          }
        }, 'image/jpeg', 0.8);
      });
    } catch (error) {
      throw new Error(`Face enrollment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async authenticateFace(
    enrollmentFeatures: number[],
    options: FaceAuthOptions = {}
  ): Promise<{ confidence: number; features: number[] }> {
    const { imageData, features } = await this.enrollFace('temp', options);
    
    // Compare face features (placeholder - would use proper face matching in production)
    const confidence = this.compareFaceFeatures(enrollmentFeatures, features);
    
    return { confidence, features };
  }

  // ============================================================================
  // MULTI-MODAL AUTHENTICATION
  // ============================================================================

  async authenticateMultiModal(
    methods: BiometricType[],
    credentials: Record<BiometricType, any>
  ): Promise<{
    results: Record<BiometricType, { success: boolean; confidence: number }>;
    overallConfidence: number;
    riskLevel: SecurityRiskLevel;
  }> {
    const results: Record<BiometricType, { success: boolean; confidence: number }> = {} as any;
    
    for (const method of methods) {
      try {
        let confidence = 0;
        
        switch (method) {
          case 'fingerprint':
            const fpResult = await this.authenticateWebAuthn(credentials.fingerprint.credentialIds);
            confidence = 0.95; // WebAuthn is highly reliable
            break;
            
          case 'face':
            const faceResult = await this.authenticateFace(credentials.face.features);
            confidence = faceResult.confidence;
            break;
            
          case 'voice':
            const voiceResult = await this.authenticateVoice(credentials.voice.features);
            confidence = voiceResult.confidence;
            break;
        }
        
        results[method] = {
          success: confidence > 0.7,
          confidence,
        };
      } catch (error) {
        results[method] = {
          success: false,
          confidence: 0,
        };
      }
    }

    // Calculate overall confidence
    const successfulMethods = Object.values(results).filter(r => r.success);
    const overallConfidence = successfulMethods.length > 0
      ? successfulMethods.reduce((sum, r) => sum + r.confidence, 0) / successfulMethods.length
      : 0;

    // Determine risk level
    let riskLevel: SecurityRiskLevel = 'critical';
    if (overallConfidence > 0.9) riskLevel = 'very_low';
    else if (overallConfidence > 0.8) riskLevel = 'low';
    else if (overallConfidence > 0.7) riskLevel = 'medium';
    else if (overallConfidence > 0.5) riskLevel = 'high';

    return { results, overallConfidence, riskLevel };
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private extractVoiceFeatures(audioBlob: Blob): number[] {
    // Placeholder implementation - would use proper audio analysis
    // In production, would extract MFCC features, pitch, formants, etc.
    return Array.from({ length: 13 }, () => Math.random());
  }

  private compareVoiceFeatures(features1: number[], features2: number[]): number {
    // Placeholder implementation - would use proper voice matching algorithms
    // In production, would use DTW, GMM, or neural networks
    if (features1.length !== features2.length) return 0;
    
    const distance = Math.sqrt(
      features1.reduce((sum, f1, i) => sum + Math.pow(f1 - features2[i], 2), 0)
    );
    
    return Math.max(0, 1 - distance / Math.sqrt(features1.length));
  }

  private extractFaceFeatures(imageBlob: Blob): number[] {
    // Placeholder implementation - would use proper face analysis
    // In production, would extract facial landmarks, eigenfaces, or deep features
    return Array.from({ length: 128 }, () => Math.random());
  }

  private compareFaceFeatures(features1: number[], features2: number[]): number {
    // Placeholder implementation - would use proper face matching algorithms
    // In production, would use face recognition libraries or neural networks
    if (features1.length !== features2.length) return 0;
    
    const distance = Math.sqrt(
      features1.reduce((sum, f1, i) => sum + Math.pow(f1 - features2[i], 2), 0)
    );
    
    return Math.max(0, 1 - distance / Math.sqrt(features1.length));
  }

  private handleWebAuthnError(error: any): void {
    console.error('WebAuthn error:', error);
    
    if (error.name === 'InvalidStateError') {
      throw new Error('Authenticator is already registered or in use');
    } else if (error.name === 'NotSupportedError') {
      throw new Error('Biometric authentication is not supported on this device');
    } else if (error.name === 'SecurityError') {
      throw new Error('Security error occurred during authentication');
    } else if (error.name === 'NotAllowedError') {
      throw new Error('Authentication was cancelled or not allowed');
    } else if (error.name === 'AbortError') {
      throw new Error('Authentication was aborted');
    }
  }

  // Check if specific biometric method is available
  async isMethodAvailable(method: BiometricType): Promise<boolean> {
    const capabilities = await this.getBiometricCapabilities();
    
    switch (method) {
      case 'fingerprint':
        return capabilities.fingerprint;
      case 'face':
        return capabilities.face;
      case 'voice':
        return capabilities.voice;
      case 'iris':
        return capabilities.iris;
      case 'palm':
        return capabilities.palm;
      default:
        return false;
    }
  }

  // Get recommended authentication methods based on device capabilities
  async getRecommendedMethods(): Promise<BiometricType[]> {
    const capabilities = await this.getBiometricCapabilities();
    const methods: BiometricType[] = [];

    // Prefer most secure and convenient methods first
    if (capabilities.fingerprint) methods.push('fingerprint');
    if (capabilities.face) methods.push('face');
    if (capabilities.voice) methods.push('voice');
    if (capabilities.iris) methods.push('iris');
    if (capabilities.palm) methods.push('palm');

    return methods;
  }
}

// Export singleton instance
export const biometricAuth = new BiometricAuthService();
export default biometricAuth; 