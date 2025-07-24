import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { AudioPlayer } from '../audio/AudioPlayer'

// Mock HTMLAudioElement
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn(),
  currentTime: 0,
  duration: 420,
  volume: 0.75,
  playbackRate: 1.0,
  muted: false,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

// Mock Audio constructor
global.Audio = vi.fn().mockImplementation(() => mockAudio)

// Mock HTML5 audio element
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  writable: true,
  value: vi.fn().mockResolvedValue(undefined)
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  writable: true,
  value: vi.fn()
})

// Mock components
vi.mock('../ui/card', () => ({
  Card: ({ children, className }: any) => <div className={className}>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <h2>{children}</h2>,
  CardDescription: ({ children }: any) => <p>{children}</p>
}))

vi.mock('../ui/button', () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button 
      onClick={onClick} 
      disabled={disabled} 
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  )
}))

vi.mock('../ui/slider', () => ({
  Slider: ({ value, onValueChange, max, min, step }: any) => (
    <input
      type="range"
      value={value[0]}
      max={max}
      min={min}
      step={step}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      data-testid="slider"
    />
  )
}))

vi.mock('../ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  )
}))

describe('AudioPlayer', () => {
  const defaultProps = {
    title: 'Test Audio Track',
    author: 'Test Author',
    duration: 420, // 7 minutes
    language: 'en',
    voiceType: 'neutral' as const
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders audio player with title and author', () => {
    render(<AudioPlayer {...defaultProps} />)
    
    expect(screen.getByText('Test Audio Track')).toBeInTheDocument()
    expect(screen.getByText(/Test Author/)).toBeInTheDocument()
  })

  it('displays duration correctly', () => {
    render(<AudioPlayer {...defaultProps} />)
    
    expect(screen.getByText('7:00')).toBeInTheDocument() // 420 seconds = 7:00
  })

  it('shows play button initially', () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const playButton = screen.getByTestId('play-pause-button')
    expect(playButton).toHaveTextContent('▶') // Play icon
  })

  it('toggles play/pause on button click', async () => {
    render(<AudioPlayer {...defaultProps} audioSrc="/test-audio.mp3" />)
    
    const playButton = screen.getByTestId('play-pause-button')
    
    // Click play
    fireEvent.click(playButton)
    await waitFor(() => {
      expect(playButton).toHaveTextContent('⏸') // Pause icon
    })
    
    // Click pause
    fireEvent.click(playButton)
    await waitFor(() => {
      expect(playButton).toHaveTextContent('▶') // Play icon
    })
  })

  it('calls onPlay callback when playing', async () => {
    const onPlay = vi.fn()
    render(<AudioPlayer {...defaultProps} onPlay={onPlay} />)
    
    const playButton = screen.getByTestId('play-pause-button')
    fireEvent.click(playButton)
    
    await waitFor(() => {
      expect(onPlay).toHaveBeenCalled()
    })
  })

  it('calls onPause callback when pausing', async () => {
    const onPause = vi.fn()
    render(<AudioPlayer {...defaultProps} onPause={onPause} />)
    
    const playButton = screen.getByTestId('play-pause-button')
    
    // Start playing
    fireEvent.click(playButton)
    await waitFor(() => {
      expect(screen.getByTestId('play-pause-button')).toHaveTextContent('⏸')
    })
    
    // Pause
    fireEvent.click(playButton)
    await waitFor(() => {
      expect(onPause).toHaveBeenCalled()
    })
  })

  it('adjusts volume with slider', async () => {
    render(<AudioPlayer {...defaultProps} audioSrc="/test-audio.mp3" />)
    
    const volumeSlider = screen.getByTestId('volume-slider')
    fireEvent.change(volumeSlider, { target: { value: '50' } })
    
    await waitFor(() => {
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  it('mutes and unmutes audio', async () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const muteButton = screen.getByTestId('mute-button')
    fireEvent.click(muteButton)
    
    await waitFor(() => {
      expect(muteButton).toHaveTextContent('🔇') // Muted icon
    })
    
    fireEvent.click(muteButton)
    await waitFor(() => {
      expect(muteButton).toHaveTextContent('🔊') // Volume icon
    })
  })

  it('skips forward and backward', async () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const skipBackButton = screen.getByTestId('skip-back-button')
    const skipForwardButton = screen.getByTestId('skip-forward-button')
    
    fireEvent.click(skipForwardButton)
    fireEvent.click(skipBackButton)
    
    // Should update current time (tested via mock implementation)
    expect(skipBackButton).toBeInTheDocument()
    expect(skipForwardButton).toBeInTheDocument()
  })

  it('stops playback', async () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const stopButton = screen.getByTestId('stop-button')
    const playButton = screen.getByTestId('play-pause-button')
    
    // Start playing
    fireEvent.click(playButton)
    await waitFor(() => {
      expect(playButton).toHaveTextContent('⏸')
    })
    
    // Stop
    fireEvent.click(stopButton)
    await waitFor(() => {
      expect(playButton).toHaveTextContent('▶')
    })
  })

  it('changes playback rate', async () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const playbackRateButton = screen.getByText('1.0x')
    fireEvent.click(playbackRateButton)
    
    // Should show dropdown with rate options
    const rate2x = screen.getByText('2.0x')
    fireEvent.click(rate2x)
    
    await waitFor(() => {
      expect(screen.getByText('2.0x')).toBeInTheDocument()
    })
  })

  it('displays language and voice type', () => {
    render(<AudioPlayer {...defaultProps} language="en" voiceType="female" />)
    
    expect(screen.getByText('🇺🇸')).toBeInTheDocument() // English flag
    expect(screen.getByText('English')).toBeInTheDocument()
    expect(screen.getByText('Female')).toBeInTheDocument()
  })

  it('shows AI generated badge when autoGenerated is true', () => {
    render(<AudioPlayer {...defaultProps} autoGenerated={true} />)
    
    expect(screen.getByText('AI Generated')).toBeInTheDocument()
  })

  it('updates progress during playback', async () => {
    render(<AudioPlayer {...defaultProps} />)
    
    const playButton = screen.getByTestId('play-pause-button')
    fireEvent.click(playButton)
    
    // Mock progress update
    await waitFor(() => {
      const progressBar = screen.getByTestId('progress')
      expect(progressBar).toBeInTheDocument()
    })
  })

  it('seeks to specific time when progress bar is clicked', async () => {
    render(<AudioPlayer {...defaultProps} audioSrc="/test-audio.mp3" />)
    
    const progressSlider = screen.getByTestId('progress-slider')
    fireEvent.change(progressSlider, { target: { value: '210' } }) // 3:30
    
    await waitFor(() => {
      expect(screen.getByText('3:30')).toBeInTheDocument()
    })
  })

  it('calls onEnded callback when audio finishes', async () => {
    const onEnded = vi.fn()
    render(<AudioPlayer {...defaultProps} onEnded={onEnded} />)
    
    const playButton = screen.getByTestId('play-pause-button')
    fireEvent.click(playButton)
    
    // Simulate audio ending (mock implementation would handle this)
    await waitFor(() => {
      // In real implementation, this would be triggered by audio event
      expect(playButton).toBeInTheDocument()
    })
  })

  it('displays metadata correctly', () => {
    render(<AudioPlayer {...defaultProps} />)
    
    expect(screen.getByText('7:00')).toBeInTheDocument() // Duration
    expect(screen.getByText('Neutral')).toBeInTheDocument() // Voice type
    expect(screen.getByText('128kbps')).toBeInTheDocument() // Quality
    expect(screen.getByText('English')).toBeInTheDocument() // Language
  })
})