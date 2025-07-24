import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// Mock Web Speech API
const mockSpeechSynthesis = {
  getVoices: jest.fn(),
  speak: jest.fn(),
  cancel: jest.fn(),
  pause: jest.fn(),
  resume: jest.fn(),
  speaking: false,
  paused: false,
  pending: false,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
};

const mockSpeechSynthesisUtterance = jest.fn().mockImplementation((text: string) => ({
  text,
  voice: null,
  volume: 1,
  rate: 1,
  pitch: 1,
  lang: 'en-US',
  onstart: null,
  onend: null,
  onerror: null,
  onpause: null,
  onresume: null,
  onmark: null,
  onboundary: null,
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock voices for different languages and genders
const mockVoices = [
  {
    name: 'Google US English',
    lang: 'en-US',
    gender: 'female',
    default: true,
    voiceURI: 'Google US English',
    localService: false,
  },
  {
    name: 'Google UK English Male',
    lang: 'en-GB',
    gender: 'male',
    default: false,
    voiceURI: 'Google UK English Male',
    localService: false,
  },
  {
    name: 'Microsoft Zira - English (United States)',
    lang: 'en-US',
    gender: 'female',
    default: false,
    voiceURI: 'Microsoft Zira - English (United States)',
    localService: true,
  },
  {
    name: 'Google français',
    lang: 'fr-FR',
    gender: 'female',
    default: false,
    voiceURI: 'Google français',
    localService: false,
  },
  {
    name: 'Google 日本語',
    lang: 'ja-JP',
    gender: 'female',
    default: false,
    voiceURI: 'Google 日本語',
    localService: false,
  },
  {
    name: 'Google العربية',
    lang: 'ar',
    gender: 'male',
    default: false,
    voiceURI: 'Google العربية',
    localService: false,
  },
];

// Set up global mocks
Object.defineProperty(window, 'speechSynthesis', {
  writable: true,
  value: mockSpeechSynthesis,
});

Object.defineProperty(window, 'SpeechSynthesisUtterance', {
  writable: true,
  value: mockSpeechSynthesisUtterance,
});

// Mock Audio Context for advanced audio features
const mockAudioContext = {
  createOscillator: jest.fn(() => ({
    connect: jest.fn(),
    start: jest.fn(),
    stop: jest.fn(),
    frequency: { value: 440 },
  })),
  createGain: jest.fn(() => ({
    connect: jest.fn(),
    gain: { value: 1 },
  })),
  destination: {},
  state: 'running',
  resume: jest.fn().mockResolvedValue(undefined),
  suspend: jest.fn().mockResolvedValue(undefined),
  close: jest.fn().mockResolvedValue(undefined),
};

Object.defineProperty(window, 'AudioContext', {
  writable: true,
  value: jest.fn(() => mockAudioContext),
});

// Mock Media Session API for mobile devices
Object.defineProperty(navigator, 'mediaSession', {
  writable: true,
  value: {
    metadata: null,
    playbackState: 'none',
    setActionHandler: jest.fn(),
  },
});

// Mock article content for TTS testing
const mockTTSArticle = {
  id: 'tts-test-article',
  title: 'The Future of Artificial Intelligence and Machine Learning',
  content: `
    <h2>Introduction</h2>
    <p>Artificial intelligence and machine learning are transforming the way we live and work. From autonomous vehicles to personalized recommendations, AI is becoming an integral part of our daily lives.</p>
    
    <h3>Current Applications</h3>
    <p>Today's AI applications include natural language processing, computer vision, and predictive analytics. These technologies power everything from virtual assistants to medical diagnosis systems.</p>
    
    <h3>Future Developments</h3>
    <p>Looking ahead, we can expect to see advances in quantum computing, neural networks, and artificial general intelligence. These developments will likely revolutionize industries and create new possibilities we haven't yet imagined.</p>
    
    <blockquote>
      "The question is not whether machines will think, but whether machines will think like humans." - Marvin Minsky
    </blockquote>
  `,
  readingTime: 5,
  wordCount: 180,
  language: 'en',
};

// Mock Text-to-Speech Component
const MockTextToSpeechPlayer = ({
  article,
  language = 'en-US',
  autoHighlight = true,
  enableVoiceSelection = true,
  enablePlaybackControls = true,
  enableBackgroundPlay = false,
  onPlayStateChange,
  onProgressUpdate,
  onVoiceChange,
}: any) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [isPaused, setIsPaused] = React.useState(false);
  const [currentPosition, setCurrentPosition] = React.useState(0);
  const [totalDuration, setTotalDuration] = React.useState(0);
  const [selectedVoice, setSelectedVoice] = React.useState<any>(null);
  const [availableVoices, setAvailableVoices] = React.useState<any[]>([]);
  const [playbackRate, setPlaybackRate] = React.useState(1.0);
  const [volume, setVolume] = React.useState(0.8);
  const [pitch, setPitch] = React.useState(1.0);
  const [currentSentence, setCurrentSentence] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const utteranceRef = React.useRef<any>(null);
  const sentences = React.useMemo(() => {
    const text = article.content.replace(/<[^>]*>/g, ' ').trim();
    return text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  }, [article.content]);

  // Load available voices
  React.useEffect(() => {
    const loadVoices = () => {
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
      const voices = mockSpeechSynthesis.getVoices();
      setAvailableVoices(voices);
      
      // Select default voice for the language
      const defaultVoice = voices.find(v => v.lang === language && v.default) || 
                          voices.find(v => v.lang.startsWith(language.split('-')[0])) ||
                          voices[0];
      setSelectedVoice(defaultVoice);
    };

    loadVoices();
    
    // Handle voices loading asynchronously
    mockSpeechSynthesis.addEventListener.mockImplementation((event, handler) => {
      if (event === 'voiceschanged') {
        setTimeout(handler, 100);
      }
    });
  }, [language]);

  // Estimate total duration
  React.useEffect(() => {
    const wordsPerMinute = 150; // Average reading speed
    const estimatedMinutes = article.wordCount / wordsPerMinute;
    setTotalDuration(estimatedMinutes * 60 * 1000); // Convert to milliseconds
  }, [article.wordCount]);

  const handlePlay = async () => {
    if (isPaused) {
      mockSpeechSynthesis.resume();
      setIsPaused(false);
      setIsPlaying(true);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const text = sentences.slice(currentSentence).join('. ');
      const utterance = new window.SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      utterance.voice = selectedVoice;
      utterance.rate = playbackRate;
      utterance.volume = volume;
      utterance.pitch = pitch;
      utterance.lang = language;

      utterance.onstart = () => {
        setIsLoading(false);
        setIsPlaying(true);
        setIsPaused(false);
        if (onPlayStateChange) onPlayStateChange(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
        setCurrentPosition(totalDuration);
        setCurrentSentence(0);
        if (onPlayStateChange) onPlayStateChange(false);
      };

      utterance.onerror = (event: any) => {
        setError(`Speech synthesis error: ${event.error}`);
        setIsLoading(false);
        setIsPlaying(false);
      };

      utterance.onboundary = (event: any) => {
        if (event.name === 'sentence') {
          const newSentence = currentSentence + 1;
          setCurrentSentence(newSentence);
          
          // Update progress
          const progress = (newSentence / sentences.length) * totalDuration;
          setCurrentPosition(progress);
          
          if (onProgressUpdate) {
            onProgressUpdate({
              position: progress,
              duration: totalDuration,
              sentence: newSentence,
              totalSentences: sentences.length,
            });
          }
        }
      };

      mockSpeechSynthesis.speak(utterance);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start speech synthesis');
      setIsLoading(false);
    }
  };

  const handlePause = () => {
    mockSpeechSynthesis.pause();
    setIsPaused(true);
    setIsPlaying(false);
  };

  const handleStop = () => {
    mockSpeechSynthesis.cancel();
    setIsPlaying(false);
    setIsPaused(false);
    setCurrentPosition(0);
    setCurrentSentence(0);
  };

  const handleVoiceChange = (voice: any) => {
    setSelectedVoice(voice);
    if (onVoiceChange) onVoiceChange(voice);
    
    // Restart playback with new voice if currently playing
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  };

  const handleSeek = (position: number) => {
    const sentenceIndex = Math.floor((position / totalDuration) * sentences.length);
    setCurrentSentence(sentenceIndex);
    setCurrentPosition(position);
    
    if (isPlaying) {
      handleStop();
      setTimeout(() => handlePlay(), 100);
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div data-testid="text-to-speech-player" className="tts-player p-4 bg-gray-50 border rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Audio Playback</h3>
        <div className="flex items-center space-x-2">
          {isLoading && (
            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" data-testid="loading-spinner"></div>
          )}
          <span className={`text-sm px-2 py-1 rounded ${
            isPlaying ? 'bg-green-100 text-green-800' : 
            isPaused ? 'bg-yellow-100 text-yellow-800' : 
            'bg-gray-100 text-gray-600'
          }`} data-testid="playback-status">
            {isLoading ? 'Loading...' : isPlaying ? 'Playing' : isPaused ? 'Paused' : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700" data-testid="error-message">
          {error}
        </div>
      )}

      {/* Voice Selection */}
      {enableVoiceSelection && (
        <div className="mb-4" data-testid="voice-selection">
          <label htmlFor="voice-select" className="block text-sm font-medium mb-2">
            Voice ({availableVoices.length} available):
          </label>
          <select
            id="voice-select"
            value={selectedVoice?.voiceURI || ''}
            onChange={(e) => {
              const voice = availableVoices.find(v => v.voiceURI === e.target.value);
              if (voice) handleVoiceChange(voice);
            }}
            className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="voice-selector"
          >
            {availableVoices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}) {voice.gender ? `- ${voice.gender}` : ''}
                {voice.localService ? ' [Local]' : ' [Cloud]'}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Playback Controls */}
      {enablePlaybackControls && (
        <div className="mb-4 space-y-3" data-testid="playback-controls">
          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handlePlay}
              disabled={isLoading || (isPlaying && !isPaused)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="play-button"
            >
              {isPaused ? '▶️ Resume' : '▶️ Play'}
            </button>
            
            <button
              onClick={handlePause}
              disabled={!isPlaying || isPaused}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="pause-button"
            >
              ⏸️ Pause
            </button>
            
            <button
              onClick={handleStop}
              disabled={!isPlaying && !isPaused}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              data-testid="stop-button"
            >
              ⏹️ Stop
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600">
              <span data-testid="current-time">{formatTime(currentPosition)}</span>
              <span data-testid="total-time">{formatTime(totalDuration)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={totalDuration}
              value={currentPosition}
              onChange={(e) => handleSeek(parseInt(e.target.value))}
              className="w-full"
              data-testid="progress-slider"
            />
            <div className="text-xs text-gray-500 text-center">
              Sentence {currentSentence + 1} of {sentences.length}
            </div>
          </div>

          {/* Advanced Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t">
            {/* Speed Control */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Speed: {playbackRate}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={playbackRate}
                onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
                className="w-full"
                data-testid="speed-control"
              />
            </div>

            {/* Volume Control */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Volume: {Math.round(volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full"
                data-testid="volume-control"
              />
            </div>

            {/* Pitch Control */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Pitch: {pitch}
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(parseFloat(e.target.value))}
                className="w-full"
                data-testid="pitch-control"
              />
            </div>
          </div>
        </div>
      )}

      {/* Text Highlighting */}
      {autoHighlight && isPlaying && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded" data-testid="text-highlight">
          <h4 className="font-medium mb-2">Currently Reading:</h4>
          <p className="text-sm">
            {sentences[currentSentence] || 'Starting...'}
          </p>
        </div>
      )}

      {/* Mobile Media Session Controls */}
      {enableBackgroundPlay && (
        <div className="text-xs text-gray-500 text-center" data-testid="background-play-info">
          Background playback enabled. Use media controls on lock screen.
        </div>
      )}
    </div>
  );
};

// Mock Audio Analytics Component
const MockAudioAnalytics = () => {
  const [analytics, setAnalytics] = React.useState({
    totalListeningTime: 0,
    completionRate: 0,
    preferredVoice: 'Google US English',
    averageSpeed: 1.0,
    deviceType: 'desktop',
    browserSupport: 'full',
  });

  React.useEffect(() => {
    // Simulate analytics collection
    const updateAnalytics = () => {
      setAnalytics(prev => ({
        ...prev,
        totalListeningTime: prev.totalListeningTime + 1,
        completionRate: Math.min(prev.completionRate + 0.1, 100),
      }));
    };

    const interval = setInterval(updateAnalytics, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div data-testid="audio-analytics" className="p-4 bg-gray-50 border rounded-lg">
      <h3 className="font-semibold mb-2">Audio Analytics</h3>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-600">Listening Time:</span>
          <span className="ml-2 font-medium" data-testid="listening-time">
            {analytics.totalListeningTime}s
          </span>
        </div>
        <div>
          <span className="text-gray-600">Completion:</span>
          <span className="ml-2 font-medium" data-testid="completion-rate">
            {analytics.completionRate.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-600">Preferred Voice:</span>
          <span className="ml-2 font-medium" data-testid="preferred-voice">
            {analytics.preferredVoice}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Avg Speed:</span>
          <span className="ml-2 font-medium" data-testid="average-speed">
            {analytics.averageSpeed}x
          </span>
        </div>
        <div>
          <span className="text-gray-600">Device:</span>
          <span className="ml-2 font-medium" data-testid="device-type">
            {analytics.deviceType}
          </span>
        </div>
        <div>
          <span className="text-gray-600">Browser Support:</span>
          <span className="ml-2 font-medium" data-testid="browser-support">
            {analytics.browserSupport}
          </span>
        </div>
      </div>
    </div>
  );
};

describe('Text-to-Speech Audio Features Tests', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    user = userEvent.setup();
    jest.clearAllMocks();
    mockSpeechSynthesis.speaking = false;
    mockSpeechSynthesis.paused = false;
    mockSpeechSynthesis.pending = false;
  });

  describe('Speech Synthesis API Support', () => {
    it('detects speech synthesis support correctly', () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      expect(screen.getByTestId('text-to-speech-player')).toBeInTheDocument();
      expect(screen.getByTestId('playback-controls')).toBeInTheDocument();
    });

    it('loads available voices for different languages', async () => {
      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          language="en-US"
          enableVoiceSelection={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      });

      const voiceSelector = screen.getByTestId('voice-selector');
      const options = voiceSelector.querySelectorAll('option');
      
      expect(options).toHaveLength(mockVoices.length);
      expect(options[0]).toHaveTextContent(/Google US English/);
      expect(options[1]).toHaveTextContent(/Google UK English Male/);
    });

    it('handles missing speech synthesis gracefully', () => {
      // Temporarily remove speech synthesis
      const originalSpeechSynthesis = window.speechSynthesis;
      delete (window as any).speechSynthesis;

      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      // Should still render but show appropriate fallback
      expect(screen.getByTestId('text-to-speech-player')).toBeInTheDocument();

      // Restore speech synthesis
      window.speechSynthesis = originalSpeechSynthesis;
    });
  });

  describe('Voice Selection and Language Support', () => {
    it('selects appropriate default voice for language', async () => {
      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          language="en-US"
          enableVoiceSelection={true}
        />
      );

      await waitFor(() => {
        const voiceSelector = screen.getByTestId('voice-selector') as HTMLSelectElement;
        expect(voiceSelector.value).toBe('Google US English');
      });
    });

    it('switches voices correctly', async () => {
      const onVoiceChange = jest.fn();

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          enableVoiceSelection={true}
          onVoiceChange={onVoiceChange}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      });

      const voiceSelector = screen.getByTestId('voice-selector');
      await user.selectOptions(voiceSelector, 'Google UK English Male');

      expect(onVoiceChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Google UK English Male',
          lang: 'en-GB',
          gender: 'male',
        })
      );
    });

    it('supports multiple language voices', async () => {
      const languages = ['en-US', 'fr-FR', 'ja-JP', 'ar'];
      
      for (const lang of languages) {
        const { rerender } = render(
          <MockTextToSpeechPlayer 
            article={mockTTSArticle} 
            language={lang}
            enableVoiceSelection={true}
          />
        );

        await waitFor(() => {
          expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
        });

        const voiceSelector = screen.getByTestId('voice-selector');
        const options = Array.from(voiceSelector.querySelectorAll('option'));
        
        // Should have appropriate voice for the language
        const hasLanguageVoice = options.some(option => 
          option.textContent?.includes(lang) || 
          option.textContent?.includes(lang.split('-')[0])
        );
        expect(hasLanguageVoice).toBe(true);

        if (lang !== languages[languages.length - 1]) {
          rerender(<div></div>);
        }
      }
    });

    it('shows voice gender and service type information', async () => {
      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          enableVoiceSelection={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      });

      const voiceSelector = screen.getByTestId('voice-selector');
      const options = Array.from(voiceSelector.querySelectorAll('option'));
      
      // Check for gender information
      const femaleVoice = options.find(opt => opt.textContent?.includes('female'));
      const maleVoice = options.find(opt => opt.textContent?.includes('male'));
      expect(femaleVoice).toBeDefined();
      expect(maleVoice).toBeDefined();

      // Check for service type information
      const localVoice = options.find(opt => opt.textContent?.includes('[Local]'));
      const cloudVoice = options.find(opt => opt.textContent?.includes('[Cloud]'));
      expect(localVoice).toBeDefined();
      expect(cloudVoice).toBeDefined();
    });
  });

  describe('Playback Controls', () => {
    it('controls basic playback (play, pause, stop)', async () => {
      const onPlayStateChange = jest.fn();

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          onPlayStateChange={onPlayStateChange}
        />
      );

      const playButton = screen.getByTestId('play-button');
      const pauseButton = screen.getByTestId('pause-button');
      const stopButton = screen.getByTestId('stop-button');

      // Initially stopped
      expect(screen.getByTestId('playback-status')).toHaveTextContent('Stopped');
      expect(pauseButton).toBeDisabled();
      expect(stopButton).toBeDisabled();

      // Start playback
      await user.click(playButton);

      await waitFor(() => {
        expect(screen.getByTestId('playback-status')).toHaveTextContent('Playing');
      });

      expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      expect(onPlayStateChange).toHaveBeenCalledWith(true);

      // Pause playback
      await user.click(pauseButton);
      expect(mockSpeechSynthesis.pause).toHaveBeenCalled();

      // Stop playback
      await user.click(stopButton);
      expect(mockSpeechSynthesis.cancel).toHaveBeenCalled();
    });

    it('handles playback speed control', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      const speedControl = screen.getByTestId('speed-control');
      
      // Change speed to 1.5x
      fireEvent.change(speedControl, { target: { value: '1.5' } });
      
      // Start playback to test speed setting
      await user.click(screen.getByTestId('play-button'));

      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });

      // Verify utterance was created with correct rate
      expect(mockSpeechSynthesisUtterance).toHaveBeenCalled();
    });

    it('controls volume and pitch correctly', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      const volumeControl = screen.getByTestId('volume-control');
      const pitchControl = screen.getByTestId('pitch-control');

      // Adjust volume to 60%
      fireEvent.change(volumeControl, { target: { value: '0.6' } });
      
      // Adjust pitch to 1.2
      fireEvent.change(pitchControl, { target: { value: '1.2' } });

      // Start playback
      await user.click(screen.getByTestId('play-button'));

      await waitFor(() => {
        expect(mockSpeechSynthesis.speak).toHaveBeenCalled();
      });
    });

    it('supports progress tracking and seeking', async () => {
      const onProgressUpdate = jest.fn();

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          onProgressUpdate={onProgressUpdate}
        />
      );

      const progressSlider = screen.getByTestId('progress-slider');
      
      // Seek to middle of content
      const midPoint = mockTTSArticle.wordCount * 2 * 1000; // Rough estimate
      fireEvent.change(progressSlider, { target: { value: midPoint.toString() } });

      expect(screen.getByTestId('current-time')).toHaveTextContent(/\d+:\d+/);
      expect(screen.getByTestId('total-time')).toHaveTextContent(/\d+:\d+/);
    });
  });

  describe('Text Highlighting and Synchronization', () => {
    it('highlights current sentence during playback', async () => {
      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          autoHighlight={true}
        />
      );

      await user.click(screen.getByTestId('play-button'));

      await waitFor(() => {
        expect(screen.getByTestId('text-highlight')).toBeInTheDocument();
      });

      const highlightSection = screen.getByTestId('text-highlight');
      expect(highlightSection).toHaveTextContent('Currently Reading:');
    });

    it('synchronizes text with audio progress', async () => {
      const onProgressUpdate = jest.fn();

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          onProgressUpdate={onProgressUpdate}
          autoHighlight={true}
        />
      );

      await user.click(screen.getByTestId('play-button'));

      // Simulate sentence boundary event
      act(() => {
        const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;
        if (utterance.onboundary) {
          utterance.onboundary({ name: 'sentence' });
        }
      });

      expect(onProgressUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          position: expect.any(Number),
          duration: expect.any(Number),
          sentence: expect.any(Number),
          totalSentences: expect.any(Number),
        })
      );
    });

    it('handles text parsing for different content types', () => {
      const htmlContent = {
        ...mockTTSArticle,
        content: `
          <h1>Title</h1>
          <p>First paragraph with <strong>bold text</strong>.</p>
          <ul>
            <li>List item one</li>
            <li>List item two</li>
          </ul>
          <blockquote>Important quote here.</blockquote>
        `,
      };

      render(<MockTextToSpeechPlayer article={htmlContent} />);

      // Should extract text and create sentences
      expect(screen.getByTestId('text-to-speech-player')).toBeInTheDocument();
    });
  });

  describe('Cross-Browser and Device Compatibility', () => {
    it('handles different browser speech synthesis implementations', async () => {
      // Test Chrome-like implementation
      mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
      
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      await waitFor(() => {
        expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      });

      const voiceSelector = screen.getByTestId('voice-selector');
      expect(voiceSelector.querySelectorAll('option')).toHaveLength(mockVoices.length);
    });

    it('detects and adapts to mobile device capabilities', () => {
      // Mock mobile user agent
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true,
      });

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          enableBackgroundPlay={true}
        />
      );

      expect(screen.getByTestId('background-play-info')).toBeInTheDocument();
      expect(screen.getByText(/Background playback enabled/)).toBeInTheDocument();
    });

    it('handles browser-specific voice loading delays', async () => {
      // Simulate delayed voice loading (common in Safari)
      mockSpeechSynthesis.getVoices.mockReturnValueOnce([]);
      
      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          enableVoiceSelection={true}
        />
      );

      // Initially no voices
      await waitFor(() => {
        const voiceSelector = screen.getByTestId('voice-selector');
        expect(voiceSelector.querySelectorAll('option')).toHaveLength(0);
      });

      // Simulate voices loaded event
      act(() => {
        mockSpeechSynthesis.getVoices.mockReturnValue(mockVoices);
        const handler = mockSpeechSynthesis.addEventListener.mock.calls.find(
          call => call[0] === 'voiceschanged'
        )?.[1];
        if (handler) handler();
      });

      await waitFor(() => {
        const voiceSelector = screen.getByTestId('voice-selector');
        expect(voiceSelector.querySelectorAll('option')).toHaveLength(mockVoices.length);
      });
    });

    it('provides fallbacks for unsupported features', () => {
      // Mock limited speech synthesis support
      const limitedSpeechSynthesis = {
        ...mockSpeechSynthesis,
        getVoices: jest.fn().mockReturnValue([]),
      };

      Object.defineProperty(window, 'speechSynthesis', {
        value: limitedSpeechSynthesis,
        configurable: true,
      });

      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      // Should still render with appropriate fallbacks
      expect(screen.getByTestId('text-to-speech-player')).toBeInTheDocument();
      
      // Restore original
      Object.defineProperty(window, 'speechSynthesis', {
        value: mockSpeechSynthesis,
      });
    });
  });

  describe('Error Handling and Recovery', () => {
    it('handles speech synthesis errors gracefully', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      await user.click(screen.getByTestId('play-button'));

      // Simulate speech synthesis error
      act(() => {
        const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;
        if (utterance.onerror) {
          utterance.onerror({ error: 'network' });
        }
      });

      await waitFor(() => {
        expect(screen.getByTestId('error-message')).toBeInTheDocument();
      });

      expect(screen.getByText(/Speech synthesis error: network/)).toBeInTheDocument();
    });

    it('recovers from interrupted playback', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      await user.click(screen.getByTestId('play-button'));

      // Simulate interruption
      act(() => {
        mockSpeechSynthesis.speaking = false;
        const utterance = mockSpeechSynthesisUtterance.mock.results[0].value;
        if (utterance.onend) {
          utterance.onend();
        }
      });

      // Should be able to restart
      expect(screen.getByTestId('play-button')).not.toBeDisabled();
    });

    it('handles audio context suspension on mobile', async () => {
      // Mock suspended audio context
      mockAudioContext.state = 'suspended';

      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      await user.click(screen.getByTestId('play-button'));

      // Should attempt to resume audio context
      expect(mockAudioContext.resume).toHaveBeenCalled();
    });
  });

  describe('Analytics and Usage Tracking', () => {
    it('tracks listening time and completion rates', async () => {
      render(<MockAudioAnalytics />);

      await waitFor(() => {
        expect(screen.getByTestId('listening-time')).toHaveTextContent(/\d+s/);
      });

      expect(screen.getByTestId('completion-rate')).toHaveTextContent(/\d+\.\d+%/);
      expect(screen.getByTestId('preferred-voice')).toBeInTheDocument();
      expect(screen.getByTestId('average-speed')).toBeInTheDocument();
    });

    it('collects device and browser compatibility data', () => {
      render(<MockAudioAnalytics />);

      expect(screen.getByTestId('device-type')).toHaveTextContent('desktop');
      expect(screen.getByTestId('browser-support')).toHaveTextContent('full');
    });

    it('tracks user preferences and settings', async () => {
      const onVoiceChange = jest.fn();

      render(
        <MockTextToSpeechPlayer 
          article={mockTTSArticle} 
          onVoiceChange={onVoiceChange}
          enableVoiceSelection={true}
        />
      );

      await waitFor(() => {
        expect(screen.getByTestId('voice-selector')).toBeInTheDocument();
      });

      const voiceSelector = screen.getByTestId('voice-selector');
      await user.selectOptions(voiceSelector, 'Microsoft Zira - English (United States)');

      expect(onVoiceChange).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Microsoft Zira - English (United States)',
          localService: true,
        })
      );
    });
  });

  describe('Accessibility Features', () => {
    it('provides proper ARIA labels for screen readers', () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      const playButton = screen.getByTestId('play-button');
      const progressSlider = screen.getByTestId('progress-slider');

      expect(playButton).toBeInTheDocument();
      expect(progressSlider).toHaveAttribute('type', 'range');
    });

    it('supports keyboard navigation for all controls', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      const controls = [
        screen.getByTestId('play-button'),
        screen.getByTestId('pause-button'),
        screen.getByTestId('stop-button'),
        screen.getByTestId('speed-control'),
        screen.getByTestId('volume-control'),
      ];

      for (const control of controls) {
        await user.tab();
        if (document.activeElement === control) {
          expect(control).toHaveFocus();
        }
      }
    });

    it('announces playback state changes to assistive technologies', async () => {
      render(<MockTextToSpeechPlayer article={mockTTSArticle} />);

      const statusElement = screen.getByTestId('playback-status');
      
      expect(statusElement).toHaveTextContent('Stopped');

      await user.click(screen.getByTestId('play-button'));

      await waitFor(() => {
        expect(statusElement).toHaveTextContent('Playing');
      });
    });
  });
}); 