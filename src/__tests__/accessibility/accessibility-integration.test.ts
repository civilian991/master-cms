import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock performance
Object.defineProperty(window, 'performance', {
  writable: true,
  value: {
    now: jest.fn().mockReturnValue(Date.now()),
  },
});

// Mock navigator
Object.defineProperty(navigator, 'maxTouchPoints', {
  writable: true,
  value: 0,
});

Object.defineProperty(navigator, 'language', {
  writable: true,
  value: 'en-US',
});

// Mock DOM APIs
const mockIntersectionObserver = jest.fn();
mockIntersectionObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
(window as any).IntersectionObserver = mockIntersectionObserver;

const mockResizeObserver = jest.fn();
mockResizeObserver.mockReturnValue({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
});
(window as any).ResizeObserver = mockResizeObserver;

const mockSpeechRecognition = jest.fn();
mockSpeechRecognition.mockImplementation(() => ({
  start: jest.fn(),
  stop: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  continuous: false,
  interimResults: false,
  lang: 'en-US',
}));
(window as any).SpeechRecognition = mockSpeechRecognition;
(window as any).webkitSpeechRecognition = mockSpeechRecognition;

const mockSpeechSynthesis = {
  speak: jest.fn(),
  cancel: jest.fn(),
  getVoices: jest.fn().mockReturnValue([]),
  addEventListener: jest.fn(),
};
(window as any).speechSynthesis = mockSpeechSynthesis;

// Mock fetch for API calls
global.fetch = jest.fn() as jest.MockedFunction<typeof fetch>;

// Mock console methods to reduce noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Import services after mocking
import { mobileAccessibilityService } from '@/lib/services/mobile-accessibility';
import { visualAccessibilityService } from '@/lib/services/visual-accessibility';
import { motorAccessibilityService } from '@/lib/services/motor-accessibility';
import { voiceControlService } from '@/lib/services/voice-control';
import { keyboardNavigationService } from '@/lib/services/keyboard-navigation';

describe('Mobile Accessibility Integration Tests', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock successful API responses
    (fetch as jest.MockedFunction<typeof fetch>).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    // Setup DOM
    document.body.innerHTML = `
      <div id="test-container">
        <main id="main-content">
          <h1>Test Page</h1>
          <nav id="navigation">
            <a href="#" id="nav-link">Navigation Link</a>
          </nav>
          <button id="test-button">Test Button</button>
          <input type="text" id="test-input" placeholder="Test input" />
          <textarea id="test-textarea"></textarea>
        </main>
      </div>
    `;
  });

  afterEach(() => {
    // Cleanup services
    try {
      mobileAccessibilityService.cleanup();
      visualAccessibilityService.cleanup();
      motorAccessibilityService.cleanup();
      voiceControlService.cleanup();
      keyboardNavigationService.cleanup();
    } catch (error) {
      // Ignore cleanup errors in tests
    }
    
    // Clean up DOM
    document.body.innerHTML = '';
  });

  describe('Service Availability', () => {
    it('should have all accessibility services available', () => {
      expect(mobileAccessibilityService).toBeDefined();
      expect(visualAccessibilityService).toBeDefined();
      expect(motorAccessibilityService).toBeDefined();
      expect(voiceControlService).toBeDefined();
      expect(keyboardNavigationService).toBeDefined();
    });

    it('should get preferences from all services', () => {
      expect(() => mobileAccessibilityService.getPreferences()).not.toThrow();
      expect(() => visualAccessibilityService.getPreferences()).not.toThrow();
      expect(() => motorAccessibilityService.getPreferences()).not.toThrow();
      expect(() => voiceControlService.getSettings()).not.toThrow();
      expect(() => keyboardNavigationService.getPreferences()).not.toThrow();
    });
  });

  describe('Mobile Accessibility Service', () => {
    it('should have default preferences', () => {
      const prefs = mobileAccessibilityService.getPreferences();
      expect(prefs).toHaveProperty('screenReader');
      expect(prefs).toHaveProperty('visualAids');
      expect(prefs).toHaveProperty('motorAssistance');
      expect(prefs).toHaveProperty('voiceControl');
      expect(prefs).toHaveProperty('keyboardNavigation');
    });

    it('should announce messages', () => {
      expect(() => {
        mobileAccessibilityService.announce({
          message: 'Test announcement',
          priority: 'polite',
          category: 'navigation',
        });
      }).not.toThrow();
    });

    it('should save preferences', async () => {
      const prefs = mobileAccessibilityService.getPreferences();
      
      await expect(mobileAccessibilityService.savePreferences({
        ...prefs,
        screenReader: { ...prefs.screenReader, enabled: true },
      })).resolves.not.toThrow();
    });
  });

  describe('Visual Accessibility Service', () => {
    it('should have default visual preferences', () => {
      const prefs = visualAccessibilityService.getPreferences();
      expect(prefs).toHaveProperty('fontSize');
      expect(prefs).toHaveProperty('contrast');
      expect(prefs).toHaveProperty('colorBlindness');
      expect(prefs).toHaveProperty('spacing');
      expect(prefs).toHaveProperty('animations');
    });

    it('should update font preferences', () => {
      const prefs = visualAccessibilityService.getPreferences();
      
      expect(() => {
        visualAccessibilityService.updatePreferences({
          ...prefs,
          fontSize: { ...prefs.fontSize, scale: 1.5 },
        });
      }).not.toThrow();
    });

    it('should test color contrast', () => {
      const result = visualAccessibilityService.testColorContrast('#000000', '#ffffff');
      
      expect(result).toHaveProperty('ratio');
      expect(result).toHaveProperty('aaCompliant');
      expect(result).toHaveProperty('aaaCompliant');
      expect(typeof result.ratio).toBe('number');
    });

    it('should get available color profiles', () => {
      const profiles = visualAccessibilityService.getColorProfiles();
      expect(Array.isArray(profiles)).toBe(true);
      expect(profiles.length).toBeGreaterThan(0);
    });
  });

  describe('Motor Accessibility Service', () => {
    it('should have default motor preferences', () => {
      const prefs = motorAccessibilityService.getPreferences();
      expect(prefs).toHaveProperty('touchTargets');
      expect(prefs).toHaveProperty('gestureAssistance');
      expect(prefs).toHaveProperty('inputAssistance');
      expect(prefs).toHaveProperty('clickAssistance');
    });

    it('should analyze touch targets', () => {
      expect(() => {
        const targets = motorAccessibilityService.analyzeTouchTargets();
        expect(Array.isArray(targets)).toBe(true);
      }).not.toThrow();
    });

    it('should get accessibility violations', () => {
      const violations = motorAccessibilityService.getAccessibilityViolations();
      
      expect(violations).toHaveProperty('smallTargets');
      expect(violations).toHaveProperty('poorSpacing');
      expect(violations).toHaveProperty('recommendations');
    });

    it('should test gesture recognition', () => {
      expect(() => {
        motorAccessibilityService.testGesture('tap');
      }).not.toThrow();
    });
  });

  describe('Voice Control Service', () => {
    it('should detect support capabilities', () => {
      const isSupported = voiceControlService.isSupported();
      expect(typeof isSupported).toBe('boolean');
    });

    it('should have default voice settings', () => {
      const settings = voiceControlService.getSettings();
      expect(settings).toHaveProperty('enabled');
      expect(settings).toHaveProperty('language');
      expect(settings).toHaveProperty('sensitivity');
    });

    it('should get available commands', () => {
      const commands = voiceControlService.getAvailableCommands();
      expect(Array.isArray(commands)).toBe(true);
      expect(commands.length).toBeGreaterThan(0);
    });

    it('should get service status', () => {
      const status = voiceControlService.getStatus();
      expect(status).toHaveProperty('isListening');
      expect(status).toHaveProperty('isDictating');
      expect(status).toHaveProperty('isSupported');
    });

    it('should manage custom commands', () => {
      const initialCommands = voiceControlService.getAvailableCommands();
      
      voiceControlService.addCustomCommand({
        phrase: 'test command',
        action: jest.fn(),
        description: 'Test command',
        category: 'content',
      });

      const updatedCommands = voiceControlService.getAvailableCommands();
      expect(updatedCommands.length).toBe(initialCommands.length + 1);

      voiceControlService.removeCustomCommand('test command');
      const finalCommands = voiceControlService.getAvailableCommands();
      expect(finalCommands.length).toBe(initialCommands.length);
    });
  });

  describe('Keyboard Navigation Service', () => {
    it('should have default keyboard preferences', () => {
      const prefs = keyboardNavigationService.getPreferences();
      expect(prefs).toHaveProperty('enabled');
      expect(prefs).toHaveProperty('skipLinks');
      expect(prefs).toHaveProperty('customShortcuts');
      expect(prefs).toHaveProperty('shortcuts');
    });

    it('should get navigation statistics', () => {
      const stats = keyboardNavigationService.getNavigationStats();
      expect(stats).toHaveProperty('totalElements');
      expect(stats).toHaveProperty('elementsByType');
      expect(stats).toHaveProperty('elementsByGroup');
    });

    it('should manage custom shortcuts', () => {
      expect(() => {
        keyboardNavigationService.addCustomShortcut(
          'ctrl+t',
          'test',
          'Test shortcut',
          jest.fn()
        );
      }).not.toThrow();

      expect(() => {
        keyboardNavigationService.removeCustomShortcut('ctrl+t');
      }).not.toThrow();
    });

    it('should handle focus navigation', () => {
      expect(() => {
        keyboardNavigationService.focusFirst();
        keyboardNavigationService.focusLast();
        keyboardNavigationService.focusNext();
        keyboardNavigationService.focusPrevious();
      }).not.toThrow();
    });

    it('should handle landmark navigation', () => {
      expect(() => {
        keyboardNavigationService.focusMainContent();
        keyboardNavigationService.focusNavigation();
        keyboardNavigationService.focusMainHeading();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    it('should handle multiple services working together', () => {
      // Update preferences across services
      const mobilePrefs = mobileAccessibilityService.getPreferences();
      const visualPrefs = visualAccessibilityService.getPreferences();
      const motorPrefs = motorAccessibilityService.getPreferences();

      expect(() => {
        mobileAccessibilityService.savePreferences({
          ...mobilePrefs,
          screenReader: { ...mobilePrefs.screenReader, enabled: true },
        });

        visualAccessibilityService.updatePreferences({
          ...visualPrefs,
          contrast: { ...visualPrefs.contrast, mode: 'high' },
        });

        motorAccessibilityService.updatePreferences({
          ...motorPrefs,
          touchTargets: { ...motorPrefs.touchTargets, enlargeAll: true },
        });
      }).not.toThrow();
    });

    it('should persist settings correctly', async () => {
      const originalPrefs = visualAccessibilityService.getPreferences();
      
      visualAccessibilityService.updatePreferences({
        ...originalPrefs,
        fontSize: { ...originalPrefs.fontSize, scale: 1.5 },
      });

      // Should call API to save
      expect(fetch).toHaveBeenCalled();
    });

    it('should handle error scenarios gracefully', async () => {
      // Mock API failure
      (fetch as jest.MockedFunction<typeof fetch>).mockRejectedValueOnce(
        new Error('Network error')
      );

      const prefs = visualAccessibilityService.getPreferences();
      
      expect(() => {
        visualAccessibilityService.updatePreferences({
          ...prefs,
          fontSize: { ...prefs.fontSize, scale: 1.2 },
        });
      }).not.toThrow();
    });
  });

  describe('Performance and Cleanup', () => {
    it('should initialize services efficiently', () => {
      const startTime = Date.now();
      
      // Access all services
      mobileAccessibilityService.getPreferences();
      visualAccessibilityService.getPreferences();
      motorAccessibilityService.getPreferences();
      voiceControlService.getSettings();
      keyboardNavigationService.getPreferences();
      
      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
    });

    it('should cleanup resources properly', () => {
      expect(() => {
        mobileAccessibilityService.cleanup();
        visualAccessibilityService.cleanup();
        motorAccessibilityService.cleanup();
        voiceControlService.cleanup();
        keyboardNavigationService.cleanup();
      }).not.toThrow();
    });
  });
}); 