'use client';

import {
  DeviceInfo,
  DeviceTrustLevel,
  GeolocationData,
  SecurityRiskLevel,
} from '../types/security.types';

interface DeviceFingerprint {
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
  screenResolution: string;
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  maxTouchPoints: number;
  canvas: string;
  webgl: string;
  audio: string;
  fonts: string[];
  plugins: string[];
}

class DeviceManagerService {
  private deviceCache = new Map<string, DeviceInfo>();
  private locationCache = new Map<string, GeolocationData>();

  // ============================================================================
  // DEVICE FINGERPRINTING
  // ============================================================================

  async generateDeviceFingerprint(): Promise<string> {
    const fingerprint = await this.collectDeviceFingerprint();
    const fingerprintString = JSON.stringify(fingerprint);
    
    // Create hash of the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprintString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  }

  private async collectDeviceFingerprint(): Promise<DeviceFingerprint> {
    const fingerprint: DeviceFingerprint = {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      pixelRatio: window.devicePixelRatio,
      hardwareConcurrency: navigator.hardwareConcurrency || 0,
      maxTouchPoints: navigator.maxTouchPoints || 0,
      canvas: await this.getCanvasFingerprint(),
      webgl: await this.getWebGLFingerprint(),
      audio: await this.getAudioFingerprint(),
      fonts: await this.getAvailableFonts(),
      plugins: this.getPluginsList(),
    };

    return fingerprint;
  }

  private async getCanvasFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      canvas.width = 200;
      canvas.height = 50;

      // Draw text with different fonts and colors
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillStyle = '#f60';
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = '#069';
      ctx.fillText('Canvas fingerprint', 2, 15);
      ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
      ctx.fillText('Canvas fingerprint', 4, 17);

      return canvas.toDataURL();
    } catch (error) {
      return '';
    }
  }

  private async getWebGLFingerprint(): Promise<string> {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) return '';

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : '';
      const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
      
      return `${vendor}~${renderer}`;
    } catch (error) {
      return '';
    }
  }

  private async getAudioFingerprint(): Promise<string> {
    try {
      if (!window.AudioContext && !(window as any).webkitAudioContext) return '';

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const analyser = audioContext.createAnalyser();
      const gainNode = audioContext.createGain();
      const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);

      gainNode.gain.value = 0;
      oscillator.type = 'triangle';
      oscillator.frequency.value = 10000;

      oscillator.connect(analyser);
      analyser.connect(scriptProcessor);
      scriptProcessor.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.start();

      return new Promise((resolve) => {
        scriptProcessor.onaudioprocess = (event) => {
          const buffer = event.inputBuffer.getChannelData(0);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) {
            sum += Math.abs(buffer[i]);
          }
          oscillator.stop();
          audioContext.close();
          resolve(sum.toString());
        };

        setTimeout(() => resolve(''), 100);
      });
    } catch (error) {
      return '';
    }
  }

  private async getAvailableFonts(): Promise<string[]> {
    const testFonts = [
      'Arial', 'Arial Black', 'Arial Narrow', 'Arial Rounded MT Bold',
      'Bookman Old Style', 'Bradley Hand ITC', 'Century', 'Century Gothic',
      'Comic Sans MS', 'Courier', 'Courier New', 'Georgia', 'Gentium',
      'Helvetica', 'Helvetica Neue', 'Impact', 'King', 'Lucida Console',
      'Lucida Grande', 'Lucida Sans Unicode', 'Monaco', 'Palatino',
      'Palatino Linotype', 'Segoe UI', 'Tahoma', 'Times', 'Times New Roman',
      'Trebuchet MS', 'Verdana',
    ];

    const availableFonts: string[] = [];
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];

    const baseFontSize = '72px';
    const testString = 'mmmmmmmmmmlli';
    
    // Get baseline measurements
    ctx.font = `${baseFontSize} monospace`;
    const baselineWidth = ctx.measureText(testString).width;
    
    for (const font of testFonts) {
      ctx.font = `${baseFontSize} ${font}, monospace`;
      const width = ctx.measureText(testString).width;
      
      if (width !== baselineWidth) {
        availableFonts.push(font);
      }
    }

    return availableFonts;
  }

  private getPluginsList(): string[] {
    if (!navigator.plugins) return [];
    
    const plugins: string[] = [];
    for (let i = 0; i < navigator.plugins.length; i++) {
      plugins.push(navigator.plugins[i].name);
    }
    return plugins;
  }

  // ============================================================================
  // DEVICE INFORMATION EXTRACTION
  // ============================================================================

  async getDeviceInfo(): Promise<Partial<DeviceInfo>> {
    const fingerprint = await this.generateDeviceFingerprint();
    const userAgent = navigator.userAgent;
    
    return {
      fingerprint,
      userAgent,
      platform: navigator.platform,
      browser: this.getBrowserInfo().name,
      browserVersion: this.getBrowserInfo().version,
      os: this.getOSInfo().name,
      osVersion: this.getOSInfo().version,
      screenResolution: `${screen.width}x${screen.height}`,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: navigator.language,
      isMobile: this.isMobileDevice(),
      isTablet: this.isTabletDevice(),
    };
  }

  private getBrowserInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    
    if (userAgent.includes('Chrome')) {
      const match = userAgent.match(/Chrome\/(\d+)/);
      return { name: 'Chrome', version: match ? match[1] : 'Unknown' };
    } else if (userAgent.includes('Firefox')) {
      const match = userAgent.match(/Firefox\/(\d+)/);
      return { name: 'Firefox', version: match ? match[1] : 'Unknown' };
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      const match = userAgent.match(/Version\/(\d+)/);
      return { name: 'Safari', version: match ? match[1] : 'Unknown' };
    } else if (userAgent.includes('Edge')) {
      const match = userAgent.match(/Edge\/(\d+)/);
      return { name: 'Edge', version: match ? match[1] : 'Unknown' };
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  private getOSInfo(): { name: string; version: string } {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    
    if (platform.includes('Win')) {
      if (userAgent.includes('Windows NT 10')) return { name: 'Windows', version: '10' };
      if (userAgent.includes('Windows NT 6.3')) return { name: 'Windows', version: '8.1' };
      if (userAgent.includes('Windows NT 6.2')) return { name: 'Windows', version: '8' };
      if (userAgent.includes('Windows NT 6.1')) return { name: 'Windows', version: '7' };
      return { name: 'Windows', version: 'Unknown' };
    } else if (platform.includes('Mac')) {
      const match = userAgent.match(/Mac OS X (\d+_\d+)/);
      const version = match ? match[1].replace('_', '.') : 'Unknown';
      return { name: 'macOS', version };
    } else if (platform.includes('Linux')) {
      return { name: 'Linux', version: 'Unknown' };
    } else if (userAgent.includes('Android')) {
      const match = userAgent.match(/Android (\d+\.\d+)/);
      return { name: 'Android', version: match ? match[1] : 'Unknown' };
    } else if (userAgent.includes('iOS') || userAgent.includes('iPhone') || userAgent.includes('iPad')) {
      const match = userAgent.match(/OS (\d+_\d+)/);
      const version = match ? match[1].replace('_', '.') : 'Unknown';
      return { name: 'iOS', version };
    }
    
    return { name: 'Unknown', version: 'Unknown' };
  }

  private isMobileDevice(): boolean {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }

  private isTabletDevice(): boolean {
    return /iPad|Android(?!.*Mobile)/i.test(navigator.userAgent);
  }

  // ============================================================================
  // GEOLOCATION
  // ============================================================================

  async getGeolocation(): Promise<GeolocationData | null> {
    try {
      // Try to get IP-based location first (more privacy-friendly)
      const ipLocation = await this.getIPBasedLocation();
      if (ipLocation) return ipLocation;

      // Fallback to GPS if available and user consents
      return await this.getGPSLocation();
    } catch (error) {
      console.warn('Geolocation failed:', error);
      return null;
    }
  }

  private async getIPBasedLocation(): Promise<GeolocationData | null> {
    try {
      // This would typically call an IP geolocation service
      // For demo purposes, we'll return mock data
      return {
        country: 'United States',
        region: 'California',
        city: 'San Francisco',
        latitude: 37.7749,
        longitude: -122.4194,
        isp: 'Example ISP',
        isVPN: false,
        isProxy: false,
        threatLevel: 'low',
      };
    } catch (error) {
      return null;
    }
  }

  private async getGPSLocation(): Promise<GeolocationData | null> {
    if (!navigator.geolocation) return null;

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            // Reverse geocoding would be performed here
            const location: GeolocationData = {
              country: 'Unknown',
              region: 'Unknown',
              city: 'Unknown',
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              isp: 'Unknown',
              isVPN: false,
              isProxy: false,
              threatLevel: 'low',
            };
            resolve(location);
          } catch (error) {
            resolve(null);
          }
        },
        () => resolve(null),
        {
          timeout: 10000,
          enableHighAccuracy: false,
          maximumAge: 300000, // 5 minutes
        }
      );
    });
  }

  // ============================================================================
  // TRUST LEVEL ASSESSMENT
  // ============================================================================

  assessDeviceTrust(deviceInfo: DeviceInfo, userHistory?: any): DeviceTrustLevel {
    let trustScore = 0;

    // Base trust from device characteristics
    if (deviceInfo.accessCount > 10) trustScore += 30;
    else if (deviceInfo.accessCount > 5) trustScore += 20;
    else if (deviceInfo.accessCount > 1) trustScore += 10;

    // Age of device registration
    const daysSinceFirstSeen = Math.floor(
      (Date.now() - deviceInfo.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceFirstSeen > 30) trustScore += 25;
    else if (daysSinceFirstSeen > 7) trustScore += 15;
    else if (daysSinceFirstSeen > 1) trustScore += 5;

    // Recent activity
    const daysSinceLastSeen = Math.floor(
      (Date.now() - deviceInfo.lastSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceLastSeen < 1) trustScore += 15;
    else if (daysSinceLastSeen < 7) trustScore += 10;
    else if (daysSinceLastSeen < 30) trustScore += 5;

    // Location consistency
    if (deviceInfo.location) {
      // Would check against user's typical locations
      trustScore += 10;
    }

    // Platform trust
    if (deviceInfo.platform.includes('Mac') || deviceInfo.platform.includes('Win')) {
      trustScore += 10;
    }

    // Browser trust
    const trustedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
    if (trustedBrowsers.includes(deviceInfo.browser)) {
      trustScore += 5;
    }

    // Determine trust level
    if (trustScore >= 80) return 'trusted';
    if (trustScore >= 60) return 'recognized';
    if (trustScore >= 40) return 'new';
    if (trustScore >= 20) return 'suspicious';
    return 'blocked';
  }

  // ============================================================================
  // RISK ASSESSMENT
  // ============================================================================

  assessSecurityRisk(deviceInfo: DeviceInfo, context?: any): SecurityRiskLevel {
    let riskScore = 0;

    // Location-based risk
    if (deviceInfo.location) {
      if (deviceInfo.location.isVPN) riskScore += 20;
      if (deviceInfo.location.isProxy) riskScore += 15;
      if (deviceInfo.location.threatLevel === 'high') riskScore += 25;
    }

    // Device age and usage patterns
    const daysSinceFirstSeen = Math.floor(
      (Date.now() - deviceInfo.firstSeen.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceFirstSeen < 1) riskScore += 15;

    // Unusual access patterns
    if (deviceInfo.accessCount < 3 && daysSinceFirstSeen > 30) {
      riskScore += 10;
    }

    // Browser/platform risks
    if (!deviceInfo.browser || deviceInfo.browser === 'Unknown') riskScore += 10;
    if (deviceInfo.isMobile && context?.highValueOperation) riskScore += 5;

    // Trust level influence
    switch (deviceInfo.trustLevel) {
      case 'blocked': riskScore += 40; break;
      case 'suspicious': riskScore += 30; break;
      case 'new': riskScore += 15; break;
      case 'recognized': riskScore += 5; break;
      case 'trusted': riskScore += 0; break;
    }

    // Convert to risk level
    if (riskScore >= 60) return 'critical';
    if (riskScore >= 45) return 'high';
    if (riskScore >= 30) return 'medium';
    if (riskScore >= 15) return 'low';
    return 'very_low';
  }

  // ============================================================================
  // DEVICE MANAGEMENT ACTIONS
  // ============================================================================

  async remoteWipe(deviceId: string): Promise<{ success: boolean; message: string }> {
    // In a real implementation, this would:
    // 1. Send wipe command to device via push notification or websocket
    // 2. Clear stored credentials and tokens
    // 3. Log the action for audit purposes
    
    try {
      // Simulate remote wipe process
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Remote wipe initiated successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to initiate remote wipe',
      };
    }
  }

  async lockDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate device lock
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Device locked successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to lock device',
      };
    }
  }

  async unlockDevice(deviceId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Simulate device unlock
      await new Promise(resolve => setTimeout(resolve, 500));
      
      return {
        success: true,
        message: 'Device unlocked successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to unlock device',
      };
    }
  }

  // ============================================================================
  // CACHE MANAGEMENT
  // ============================================================================

  cacheDeviceInfo(deviceId: string, deviceInfo: DeviceInfo): void {
    this.deviceCache.set(deviceId, deviceInfo);
  }

  getCachedDeviceInfo(deviceId: string): DeviceInfo | undefined {
    return this.deviceCache.get(deviceId);
  }

  clearDeviceCache(): void {
    this.deviceCache.clear();
    this.locationCache.clear();
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  isCurrentDevice(deviceFingerprint: string): boolean {
    // Compare with current device fingerprint
    return this.generateDeviceFingerprint().then(current => current === deviceFingerprint);
  }

  generateDeviceNickname(deviceInfo: DeviceInfo): string {
    const os = deviceInfo.os;
    const browser = deviceInfo.browser;
    const location = deviceInfo.location?.city || 'Unknown Location';
    
    return `${os} ${browser} (${location})`;
  }

  getDeviceIcon(deviceInfo: DeviceInfo): string {
    if (deviceInfo.isMobile) return '📱';
    if (deviceInfo.isTablet) return '📱';
    if (deviceInfo.os.includes('Mac')) return '💻';
    if (deviceInfo.os.includes('Windows')) return '🖥️';
    if (deviceInfo.os.includes('Linux')) return '🐧';
    return '💻';
  }
}

// Export singleton instance
export const deviceManager = new DeviceManagerService();
export default deviceManager; 