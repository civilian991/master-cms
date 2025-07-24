'use client';

export interface VoiceCommand {
  phrase: string;
  action: () => void;
  description: string;
  category: 'navigation' | 'content' | 'form' | 'accessibility';
  aliases?: string[];
}

export interface DictationSession {
  id: string;
  targetElement: HTMLInputElement | HTMLTextAreaElement;
  isActive: boolean;
  startTime: Date;
  transcript: string;
  confidence: number;
}

export interface VoiceControlSettings {
  enabled: boolean;
  language: string;
  sensitivity: 'low' | 'medium' | 'high';
  commandTimeout: number; // milliseconds
  dictationMode: boolean;
  autoCorrection: boolean;
  voiceFeedback: boolean;
  customCommands: VoiceCommand[];
}

export interface SpeechSynthesisSettings {
  enabled: boolean;
  voice: string;
  rate: number; // 0.1 to 10
  pitch: number; // 0 to 2
  volume: number; // 0 to 1
}

class VoiceControlService {
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private settings: VoiceControlSettings;
  private synthesisSettings: SpeechSynthesisSettings;
  private isListening = false;
  private dictationSession: DictationSession | null = null;
  private commandHistory: string[] = [];
  private lastCommandTime = 0;
  private confidence_threshold = 0.7;

  private defaultCommands: VoiceCommand[] = [
    {
      phrase: 'scroll up',
      action: () => window.scrollBy(0, -300),
      description: 'Scroll page up',
      category: 'navigation',
      aliases: ['go up', 'page up'],
    },
    {
      phrase: 'scroll down',
      action: () => window.scrollBy(0, 300),
      description: 'Scroll page down',
      category: 'navigation',
      aliases: ['go down', 'page down'],
    },
    {
      phrase: 'go to top',
      action: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
      description: 'Scroll to top of page',
      category: 'navigation',
      aliases: ['top of page', 'beginning'],
    },
    {
      phrase: 'go to bottom',
      action: () => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }),
      description: 'Scroll to bottom of page',
      category: 'navigation',
      aliases: ['bottom of page', 'end'],
    },
    {
      phrase: 'click',
      action: () => this.clickFocusedElement(),
      description: 'Click the focused element',
      category: 'content',
      aliases: ['activate', 'select', 'press'],
    },
    {
      phrase: 'next',
      action: () => this.navigateToNext(),
      description: 'Navigate to next focusable element',
      category: 'navigation',
      aliases: ['next item', 'forward'],
    },
    {
      phrase: 'previous',
      action: () => this.navigateToPrevious(),
      description: 'Navigate to previous focusable element',
      category: 'navigation',
      aliases: ['previous item', 'back', 'backward'],
    },
    {
      phrase: 'main content',
      action: () => this.focusMainContent(),
      description: 'Focus on main content area',
      category: 'navigation',
      aliases: ['main', 'content'],
    },
    {
      phrase: 'navigation',
      action: () => this.focusNavigation(),
      description: 'Focus on navigation menu',
      category: 'navigation',
      aliases: ['nav', 'menu'],
    },
    {
      phrase: 'search',
      action: () => this.focusSearch(),
      description: 'Focus on search field',
      category: 'navigation',
      aliases: ['find', 'search box'],
    },
    {
      phrase: 'start dictation',
      action: () => this.startDictation(),
      description: 'Start dictation mode',
      category: 'form',
      aliases: ['dictate', 'voice input'],
    },
    {
      phrase: 'stop dictation',
      action: () => this.stopDictation(),
      description: 'Stop dictation mode',
      category: 'form',
      aliases: ['end dictation', 'stop voice input'],
    },
    {
      phrase: 'help',
      action: () => this.showVoiceHelp(),
      description: 'Show available voice commands',
      category: 'accessibility',
      aliases: ['voice help', 'commands'],
    },
    {
      phrase: 'repeat',
      action: () => this.repeatLastAnnouncement(),
      description: 'Repeat last announcement',
      category: 'accessibility',
      aliases: ['say again', 'repeat that'],
    },
    {
      phrase: 'zoom in',
      action: () => this.zoomIn(),
      description: 'Increase page zoom',
      category: 'accessibility',
      aliases: ['bigger', 'increase size'],
    },
    {
      phrase: 'zoom out',
      action: () => this.zoomOut(),
      description: 'Decrease page zoom',
      category: 'accessibility',
      aliases: ['smaller', 'decrease size'],
    },
  ];

  constructor() {
    this.settings = this.getDefaultSettings();
    this.synthesisSettings = this.getDefaultSynthesisSettings();
    this.initializeServices();
  }

  /**
   * Get default voice control settings
   */
  private getDefaultSettings(): VoiceControlSettings {
    return {
      enabled: false,
      language: this.detectLanguage(),
      sensitivity: 'medium',
      commandTimeout: 3000,
      dictationMode: false,
      autoCorrection: true,
      voiceFeedback: true,
      customCommands: [],
    };
  }

  /**
   * Get default speech synthesis settings
   */
  private getDefaultSynthesisSettings(): SpeechSynthesisSettings {
    return {
      enabled: true,
      voice: '',
      rate: 1,
      pitch: 1,
      volume: 0.8,
    };
  }

  /**
   * Detect user's preferred language
   */
  private detectLanguage(): string {
    return navigator.language || 'en-US';
  }

  /**
   * Initialize speech recognition and synthesis services
   */
  private async initializeServices(): Promise<void> {
    try {
      // Initialize Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        this.recognition = new SpeechRecognition();
        this.setupSpeechRecognition();
      } else {
        console.warn('Speech Recognition not supported in this browser');
      }

      // Initialize Speech Synthesis
      if ('speechSynthesis' in window) {
        this.synthesis = window.speechSynthesis;
        this.setupSpeechSynthesis();
      } else {
        console.warn('Speech Synthesis not supported in this browser');
      }

      console.log('Voice Control Service initialized');
    } catch (error) {
      console.error('Failed to initialize Voice Control Service:', error);
    }
  }

  /**
   * Setup speech recognition
   */
  private setupSpeechRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = this.settings.language;

    // Set sensitivity
    const sensitivityMap = {
      low: 0.6,
      medium: 0.7,
      high: 0.8,
    };
    this.confidence_threshold = sensitivityMap[this.settings.sensitivity];

    this.recognition.onstart = () => {
      this.isListening = true;
      this.announceVoice('Voice control listening');
      console.log('Voice recognition started');
    };

    this.recognition.onend = () => {
      this.isListening = false;
      if (this.settings.enabled && !this.dictationSession) {
        // Restart recognition if it was stopped unexpectedly
        setTimeout(() => {
          if (this.settings.enabled) {
            this.startListening();
          }
        }, 1000);
      }
    };

    this.recognition.onresult = (event: any) => {
      this.handleSpeechResult(event);
    };

    this.recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      if (event.error === 'no-speech') {
        this.announceVoice('No speech detected');
      } else if (event.error === 'audio-capture') {
        this.announceVoice('Microphone not available');
      } else if (event.error === 'not-allowed') {
        this.announceVoice('Microphone permission denied');
      }
    };
  }

  /**
   * Setup speech synthesis
   */
  private setupSpeechSynthesis(): void {
    if (!this.synthesis) return;

    // Load available voices
    this.synthesis.onvoiceschanged = () => {
      const voices = this.synthesis!.getVoices();
      
      // Find default voice for user's language
      const defaultVoice = voices.find(voice => 
        voice.lang.startsWith(this.settings.language.substring(0, 2)) && voice.default
      );
      
      if (defaultVoice && !this.synthesisSettings.voice) {
        this.synthesisSettings.voice = defaultVoice.name;
      }
    };
  }

  /**
   * Handle speech recognition results
   */
  private handleSpeechResult(event: any): void {
    const results = event.results;
    const latestResult = results[results.length - 1];
    
    if (!latestResult.isFinal) {
      // Handle interim results for dictation
      if (this.dictationSession) {
        this.handleDictationInterim(latestResult[0].transcript);
      }
      return;
    }

    const transcript = latestResult[0].transcript.toLowerCase().trim();
    const confidence = latestResult[0].confidence;

    if (confidence < this.confidence_threshold) {
      console.log(`Low confidence (${confidence}): ${transcript}`);
      return;
    }

    console.log(`Voice command: ${transcript} (confidence: ${confidence})`);

    if (this.dictationSession) {
      this.handleDictationFinal(transcript, confidence);
    } else {
      this.handleVoiceCommand(transcript);
    }
  }

  /**
   * Handle voice commands
   */
  private handleVoiceCommand(transcript: string): void {
    const now = Date.now();
    
    // Prevent rapid duplicate commands
    if (now - this.lastCommandTime < 500) {
      return;
    }

    this.lastCommandTime = now;
    this.commandHistory.push(transcript);
    
    // Keep only last 10 commands
    if (this.commandHistory.length > 10) {
      this.commandHistory.shift();
    }

    // Find matching command
    const allCommands = [...this.defaultCommands, ...this.settings.customCommands];
    const command = this.findMatchingCommand(transcript, allCommands);

    if (command) {
      try {
        command.action();
        this.announceVoice(`${command.description} executed`);
      } catch (error) {
        console.error('Error executing voice command:', error);
        this.announceVoice('Command failed');
      }
    } else {
      // Handle partial matches or suggestions
      const suggestions = this.findSimilarCommands(transcript, allCommands);
      if (suggestions.length > 0) {
        this.announceVoice(`Did you mean: ${suggestions[0].phrase}?`);
      } else {
        this.announceVoice('Command not recognized');
      }
    }
  }

  /**
   * Find matching voice command
   */
  private findMatchingCommand(transcript: string, commands: VoiceCommand[]): VoiceCommand | null {
    // Exact phrase match
    let match = commands.find(cmd => cmd.phrase === transcript);
    if (match) return match;

    // Alias match
    match = commands.find(cmd => 
      cmd.aliases?.some(alias => alias === transcript)
    );
    if (match) return match;

    // Partial phrase match
    match = commands.find(cmd => 
      transcript.includes(cmd.phrase) || cmd.phrase.includes(transcript)
    );
    if (match) return match;

    // Partial alias match
    match = commands.find(cmd => 
      cmd.aliases?.some(alias => 
        transcript.includes(alias) || alias.includes(transcript)
      )
    );
    
    return match || null;
  }

  /**
   * Find similar commands for suggestions
   */
  private findSimilarCommands(transcript: string, commands: VoiceCommand[]): VoiceCommand[] {
    const words = transcript.split(' ');
    
    return commands
      .map(cmd => ({
        command: cmd,
        similarity: this.calculateSimilarity(transcript, cmd.phrase, cmd.aliases),
      }))
      .filter(item => item.similarity > 0.3)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3)
      .map(item => item.command);
  }

  /**
   * Calculate similarity between strings
   */
  private calculateSimilarity(transcript: string, phrase: string, aliases?: string[]): number {
    const allPhrases = [phrase, ...(aliases || [])];
    
    return Math.max(...allPhrases.map(p => {
      const transcriptWords = transcript.split(' ');
      const phraseWords = p.split(' ');
      
      const commonWords = transcriptWords.filter(word => 
        phraseWords.some(pWord => 
          pWord.includes(word) || word.includes(pWord)
        )
      );
      
      return commonWords.length / Math.max(transcriptWords.length, phraseWords.length);
    }));
  }

  /**
   * Handle dictation interim results
   */
  private handleDictationInterim(transcript: string): void {
    if (!this.dictationSession) return;

    // Show interim results in the target element
    const element = this.dictationSession.targetElement;
    const originalValue = element.value;
    
    // Remove previous interim results
    const baseText = originalValue.substring(0, originalValue.length - this.dictationSession.transcript.length);
    element.value = baseText + transcript;
    
    // Update session
    this.dictationSession.transcript = transcript;
  }

  /**
   * Handle dictation final results
   */
  private handleDictationFinal(transcript: string, confidence: number): void {
    if (!this.dictationSession) return;

    const element = this.dictationSession.targetElement;
    
    // Process dictation commands
    if (transcript.includes('new line') || transcript.includes('line break')) {
      element.value += '\n';
      this.dictationSession.transcript = '';
      return;
    }
    
    if (transcript.includes('delete') || transcript.includes('backspace')) {
      if (transcript.includes('word')) {
        this.deleteLastWord(element);
      } else {
        element.value = element.value.slice(0, -1);
      }
      this.dictationSession.transcript = '';
      return;
    }

    // Apply auto-correction if enabled
    let finalText = transcript;
    if (this.settings.autoCorrection) {
      finalText = this.applyAutoCorrection(transcript);
    }

    // Add punctuation intelligence
    finalText = this.addSmartPunctuation(finalText);

    // Update element value
    const currentValue = element.value;
    const baseText = currentValue.substring(0, currentValue.length - this.dictationSession.transcript.length);
    element.value = baseText + finalText + ' ';

    // Update session
    this.dictationSession.transcript = '';
    this.dictationSession.confidence = confidence;

    // Trigger input event for reactivity
    element.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /**
   * Apply auto-correction to dictated text
   */
  private applyAutoCorrection(text: string): string {
    const corrections: Record<string, string> = {
      'there': 'their',
      'to': 'too',
      'your': 'you\'re',
      'its': 'it\'s',
      'cant': 'can\'t',
      'wont': 'won\'t',
      'dont': 'don\'t',
    };

    let correctedText = text;
    Object.entries(corrections).forEach(([wrong, right]) => {
      const regex = new RegExp(`\\b${wrong}\\b`, 'gi');
      correctedText = correctedText.replace(regex, right);
    });

    return correctedText;
  }

  /**
   * Add smart punctuation to dictated text
   */
  private addSmartPunctuation(text: string): string {
    let punctuatedText = text;

    // Add periods after complete sentences
    if (!punctuatedText.match(/[.!?]$/)) {
      const words = punctuatedText.split(' ');
      if (words.length > 5) {
        punctuatedText += '.';
      }
    }

    // Convert dictated punctuation
    punctuatedText = punctuatedText
      .replace(/\bperiod\b/gi, '.')
      .replace(/\bcomma\b/gi, ',')
      .replace(/\bquestion mark\b/gi, '?')
      .replace(/\bexclamation point\b/gi, '!')
      .replace(/\bcolon\b/gi, ':')
      .replace(/\bsemicolon\b/gi, ';');

    return punctuatedText;
  }

  /**
   * Delete last word from element
   */
  private deleteLastWord(element: HTMLInputElement | HTMLTextAreaElement): void {
    const value = element.value;
    const words = value.trim().split(' ');
    words.pop();
    element.value = words.join(' ') + (words.length > 0 ? ' ' : '');
  }

  /**
   * Start voice control listening
   */
  public async startListening(): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not available');
    }

    if (this.isListening) return;

    try {
      this.recognition.start();
      this.settings.enabled = true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      throw error;
    }
  }

  /**
   * Stop voice control listening
   */
  public stopListening(): void {
    if (!this.recognition || !this.isListening) return;

    this.recognition.stop();
    this.settings.enabled = false;
    this.announceVoice('Voice control stopped');
  }

  /**
   * Start dictation mode
   */
  public startDictation(): void {
    const activeElement = document.activeElement as HTMLInputElement | HTMLTextAreaElement;
    
    if (!activeElement || (activeElement.tagName !== 'INPUT' && activeElement.tagName !== 'TEXTAREA')) {
      this.announceVoice('Please focus on a text field first');
      return;
    }

    if (this.dictationSession) {
      this.stopDictation();
    }

    this.dictationSession = {
      id: `dictation-${Date.now()}`,
      targetElement: activeElement,
      isActive: true,
      startTime: new Date(),
      transcript: '',
      confidence: 0,
    };

    this.settings.dictationMode = true;
    this.announceVoice('Dictation started. Speak naturally.');

    // Ensure voice recognition is running
    if (!this.isListening) {
      this.startListening();
    }
  }

  /**
   * Stop dictation mode
   */
  public stopDictation(): void {
    if (!this.dictationSession) return;

    this.dictationSession.isActive = false;
    this.settings.dictationMode = false;

    const duration = Date.now() - this.dictationSession.startTime.getTime();
    this.announceVoice(`Dictation stopped. Session lasted ${Math.round(duration / 1000)} seconds.`);

    this.dictationSession = null;
  }

  /**
   * Voice command implementations
   */
  private clickFocusedElement(): void {
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement && (activeElement.tagName === 'BUTTON' || activeElement.tagName === 'A')) {
      activeElement.click();
    } else {
      this.announceVoice('No clickable element focused');
    }
  }

  private navigateToNext(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const nextIndex = (currentIndex + 1) % focusableElements.length;
    focusableElements[nextIndex]?.focus();
  }

  private navigateToPrevious(): void {
    const focusableElements = this.getFocusableElements();
    const currentIndex = focusableElements.indexOf(document.activeElement as HTMLElement);
    const prevIndex = currentIndex === 0 ? focusableElements.length - 1 : currentIndex - 1;
    focusableElements[prevIndex]?.focus();
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    return Array.from(document.querySelectorAll(selector)) as HTMLElement[];
  }

  private focusMainContent(): void {
    const main = document.querySelector('main, [role="main"], #main-content') as HTMLElement;
    if (main) {
      main.focus();
      this.announceVoice('Focused on main content');
    } else {
      this.announceVoice('Main content not found');
    }
  }

  private focusNavigation(): void {
    const nav = document.querySelector('nav, [role="navigation"], #navigation') as HTMLElement;
    if (nav) {
      nav.focus();
      this.announceVoice('Focused on navigation');
    } else {
      this.announceVoice('Navigation not found');
    }
  }

  private focusSearch(): void {
    const search = document.querySelector('input[type="search"], [role="search"] input, #search') as HTMLElement;
    if (search) {
      search.focus();
      this.announceVoice('Focused on search field');
    } else {
      this.announceVoice('Search field not found');
    }
  }

  private showVoiceHelp(): void {
    const commands = [...this.defaultCommands, ...this.settings.customCommands];
    const helpText = commands
      .slice(0, 10)
      .map(cmd => `Say "${cmd.phrase}" to ${cmd.description}`)
      .join('. ');
    
    this.announceVoice(`Available commands: ${helpText}`);
  }

  private repeatLastAnnouncement(): void {
    // This would need integration with the accessibility service
    this.announceVoice('Repeat functionality not yet implemented');
  }

  private zoomIn(): void {
    const currentZoom = parseFloat(document.body.style.zoom) || 1;
    const newZoom = Math.min(currentZoom + 0.1, 2);
    document.body.style.zoom = newZoom.toString();
    this.announceVoice(`Zoom level ${Math.round(newZoom * 100)}%`);
  }

  private zoomOut(): void {
    const currentZoom = parseFloat(document.body.style.zoom) || 1;
    const newZoom = Math.max(currentZoom - 0.1, 0.5);
    document.body.style.zoom = newZoom.toString();
    this.announceVoice(`Zoom level ${Math.round(newZoom * 100)}%`);
  }

  /**
   * Announce text using speech synthesis
   */
  private announceVoice(text: string): void {
    if (!this.synthesis || !this.synthesisSettings.enabled || !this.settings.voiceFeedback) {
      return;
    }

    // Cancel any ongoing speech
    this.synthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Apply settings
    if (this.synthesisSettings.voice) {
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.name === this.synthesisSettings.voice);
      if (voice) {
        utterance.voice = voice;
      }
    }
    
    utterance.rate = this.synthesisSettings.rate;
    utterance.pitch = this.synthesisSettings.pitch;
    utterance.volume = this.synthesisSettings.volume;

    this.synthesis.speak(utterance);
  }

  /**
   * Add custom voice command
   */
  public addCustomCommand(command: VoiceCommand): void {
    this.settings.customCommands.push(command);
    this.saveSettings();
  }

  /**
   * Remove custom voice command
   */
  public removeCustomCommand(phrase: string): void {
    this.settings.customCommands = this.settings.customCommands.filter(
      cmd => cmd.phrase !== phrase
    );
    this.saveSettings();
  }

  /**
   * Get all available commands
   */
  public getAvailableCommands(): VoiceCommand[] {
    return [...this.defaultCommands, ...this.settings.customCommands];
  }

  /**
   * Update voice control settings
   */
  public updateSettings(settings: Partial<VoiceControlSettings>): void {
    this.settings = { ...this.settings, ...settings };
    
    if (this.recognition) {
      this.recognition.lang = this.settings.language;
      
      const sensitivityMap = {
        low: 0.6,
        medium: 0.7,
        high: 0.8,
      };
      this.confidence_threshold = sensitivityMap[this.settings.sensitivity];
    }
    
    this.saveSettings();
  }

  /**
   * Update speech synthesis settings
   */
  public updateSynthesisSettings(settings: Partial<SpeechSynthesisSettings>): void {
    this.synthesisSettings = { ...this.synthesisSettings, ...settings };
    this.saveSynthesisSettings();
  }

  /**
   * Get current settings
   */
  public getSettings(): VoiceControlSettings {
    return { ...this.settings };
  }

  /**
   * Get synthesis settings
   */
  public getSynthesisSettings(): SpeechSynthesisSettings {
    return { ...this.synthesisSettings };
  }

  /**
   * Get available voices
   */
  public getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.synthesis ? this.synthesis.getVoices() : [];
  }

  /**
   * Check if voice control is supported
   */
  public isSupported(): boolean {
    const SpeechRecognition = (window as any).SpeechRecognition || 
                              (window as any).webkitSpeechRecognition;
    return !!(SpeechRecognition && 'speechSynthesis' in window);
  }

  /**
   * Get current status
   */
  public getStatus(): {
    isListening: boolean;
    isDictating: boolean;
    isSupported: boolean;
    hasPermission: boolean;
  } {
    return {
      isListening: this.isListening,
      isDictating: !!this.dictationSession,
      isSupported: this.isSupported(),
      hasPermission: true, // Would need to check microphone permissions
    };
  }

  /**
   * Save settings to storage
   */
  private async saveSettings(): Promise<void> {
    try {
      await fetch('/api/accessibility/voice-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.settings),
      });
    } catch (error) {
      console.error('Failed to save voice settings:', error);
    }
  }

  /**
   * Save synthesis settings to storage
   */
  private async saveSynthesisSettings(): Promise<void> {
    try {
      await fetch('/api/accessibility/synthesis-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(this.synthesisSettings),
      });
    } catch (error) {
      console.error('Failed to save synthesis settings:', error);
    }
  }

  /**
   * Cleanup service
   */
  public cleanup(): void {
    this.stopListening();
    this.stopDictation();
    
    if (this.synthesis) {
      this.synthesis.cancel();
    }
  }
}

// Export singleton instance
export const voiceControlService = new VoiceControlService();
export default voiceControlService; 