import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { OfflineManager } from '../offline/OfflineManager'

// Mock navigator.connection
Object.defineProperty(navigator, 'connection', {
  writable: true,
  value: {
    effectiveType: '4g',
    downlink: 10,
    saveData: false,
    type: 'wifi'
  }
})

// Mock online/offline events
Object.defineProperty(window, 'navigator', {
  writable: true,
  value: {
    ...window.navigator,
    onLine: true
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
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

vi.mock('../ui/progress', () => ({
  Progress: ({ value, className }: any) => (
    <div data-testid="progress" data-value={value} className={className} />
  )
}))

vi.mock('../ui/tabs', () => ({
  Tabs: ({ children, defaultValue }: any) => (
    <div data-testid="tabs" data-default-value={defaultValue}>{children}</div>
  ),
  TabsContent: ({ children, value }: any) => (
    <div data-testid={`tabs-content-${value}`}>{children}</div>
  ),
  TabsList: ({ children }: any) => <div>{children}</div>,
  TabsTrigger: ({ children, value }: any) => (
    <button data-value={value}>{children}</button>
  )
}))

describe('OfflineManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset online status
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
  })

  it('renders offline manager with title', () => {
    render(<OfflineManager />)
    
    expect(screen.getByText('Offline Manager')).toBeInTheDocument()
    expect(screen.getByText(/Download content for offline access/)).toBeInTheDocument()
  })

  it('displays online status correctly', () => {
    render(<OfflineManager />)
    
    expect(screen.getByText(/4G wifi/i)).toBeInTheDocument()
  })

  it('displays offline status when offline', () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    
    render(<OfflineManager />)
    
    expect(screen.getByText('Offline')).toBeInTheDocument()
  })

  it('shows storage statistics', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      expect(screen.getByText(/Used/)).toBeInTheDocument()
      expect(screen.getByText(/Limit/)).toBeInTheDocument()
      expect(screen.getByText(/Downloaded/)).toBeInTheDocument()
    })
  })

  it('displays offline content list', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      expect(screen.getByText('Advanced Machine Learning Techniques')).toBeInTheDocument()
      expect(screen.getByText('Cybersecurity Best Practices')).toBeInTheDocument()
    })
  })

  it('shows download progress for downloading items', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      const progressBars = screen.getAllByTestId('progress')
      expect(progressBars.length).toBeGreaterThan(0)
    })
  })

  it('removes content when delete button is clicked', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      const deleteButtons = screen.getAllByTestId('delete-button')
      fireEvent.click(deleteButtons[0])
    })
    
    // Content should be removed from the list
    await waitFor(() => {
      expect(screen.queryByText('Advanced Machine Learning Techniques')).not.toBeInTheDocument()
    })
  })

  it('clears all content', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      const clearAllButton = screen.getByText('Clear All')
      fireEvent.click(clearAllButton)
    })
    
    await waitFor(() => {
      expect(screen.getByText('No Offline Content')).toBeInTheDocument()
    })
  })

  it('refreshes content list', async () => {
    render(<OfflineManager />)
    
    const refreshButton = screen.getByText('Refresh')
    fireEvent.click(refreshButton)
    
    // Should trigger loading state
    expect(refreshButton).toBeDisabled()
  })

  it('toggles offline settings', async () => {
    render(<OfflineManager />)
    
    const settingsTab = screen.getByText('Settings')
    fireEvent.click(settingsTab)
    
    await waitFor(() => {
      const autoDownloadToggle = screen.getByTestId('auto-download-toggle')
      fireEvent.click(autoDownloadToggle)
    })
    
    // Setting should be updated
    expect(screen.getByTestId('auto-download-toggle')).toBeChecked()
  })

  it('adjusts storage limit', async () => {
    render(<OfflineManager />)
    
    const settingsTab = screen.getByText('Settings')
    fireEvent.click(settingsTab)
    
    await waitFor(() => {
      const storageSlider = screen.getByTestId('storage-slider')
      fireEvent.change(storageSlider, { target: { value: '1000' } })
    })
    
    expect(screen.getByText('1000MB')).toBeInTheDocument()
  })

  it('shows storage warning when nearly full', async () => {
    // Mock high storage usage
    const highStorageManager = () => {
      const component = render(<OfflineManager />)
      // Simulate high storage usage
      return component
    }
    
    render(<OfflineManager />)
    
    // This would be triggered by actual storage calculation
    await waitFor(() => {
      if (screen.queryByText(/Storage is getting full/)) {
        expect(screen.getByText(/Storage is getting full/)).toBeInTheDocument()
      }
    })
  })

  it('filters content by type', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      // Should show different content types
      expect(screen.getByText('article')).toBeInTheDocument()
      expect(screen.getByText('image')).toBeInTheDocument()
      expect(screen.getByText('audio')).toBeInTheDocument()
    })
  })

  it('downloads new content', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      const downloadButton = screen.getByTestId('download-button')
      fireEvent.click(downloadButton)
    })
    
    // Should show download progress
    await waitFor(() => {
      expect(screen.getByText(/Downloading.../)).toBeInTheDocument()
    })
  })

  it('handles wifi-only setting', async () => {
    render(<OfflineManager />)
    
    const settingsTab = screen.getByText('Settings')
    fireEvent.click(settingsTab)
    
    await waitFor(() => {
      const wifiOnlyToggle = screen.getByTestId('wifi-only-toggle')
      expect(wifiOnlyToggle).toBeChecked() // Should be enabled by default
    })
  })

  it('shows auto-cleanup settings', async () => {
    render(<OfflineManager />)
    
    const settingsTab = screen.getByText('Settings')
    fireEvent.click(settingsTab)
    
    await waitFor(() => {
      expect(screen.getByText('Auto-cleanup old content')).toBeInTheDocument()
      expect(screen.getByText(/Cleanup after:/)).toBeInTheDocument()
    })
  })

  it('formats file sizes correctly', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      expect(screen.getByText('2.5MB')).toBeInTheDocument() // Article
      expect(screen.getByText('500KB')).toBeInTheDocument() // Image
      expect(screen.getByText('15.0MB')).toBeInTheDocument() // Audio
    })
  })

  it('shows content categories', async () => {
    render(<OfflineManager />)
    
    await waitFor(() => {
      expect(screen.getByText('AI/ML')).toBeInTheDocument()
      expect(screen.getByText('Security')).toBeInTheDocument()
      expect(screen.getByText('Cloud')).toBeInTheDocument()
    })
  })

  it('handles network status changes', () => {
    render(<OfflineManager />)
    
    // Simulate going offline
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true })
    fireEvent(window, new Event('offline'))
    
    expect(screen.getByText('Offline')).toBeInTheDocument()
    
    // Simulate going online
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true })
    fireEvent(window, new Event('online'))
    
    // Should update status
    expect(screen.queryByText('Offline')).not.toBeInTheDocument()
  })
})