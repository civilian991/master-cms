/**
 * PWA Components
 * UI components for Progressive Web App features
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { pwaService, PWAInstallPrompt, PWAUpdateStatus, PWACapabilities } from '@/lib/services/pwa-service';
import { 
  Download, 
  RefreshCw, 
  Smartphone, 
  Monitor, 
  Tablet,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Share2,
  Bell,
  Settings,
  X,
  Home
} from 'lucide-react';

// Install Prompt Component
interface InstallPromptProps {
  onDismiss?: () => void;
  className?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ onDismiss, className }) => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Check install status
    const checkInstallStatus = () => {
      const prompt = pwaService.getInstallPrompt();
      setInstallPrompt(prompt);
    };

    checkInstallStatus();

    // Listen for install prompt availability
    pwaService.onInstallPromptAvailable(() => {
      checkInstallStatus();
    });

    // Check periodically
    const interval = setInterval(checkInstallStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt?.canInstall) return;

    setIsInstalling(true);
    try {
      const result = await pwaService.promptInstall();
      if (result.success) {
        onDismiss?.();
      }
    } catch (error) {
      console.error('Install failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const getIconForPlatform = (platform: string) => {
    switch (platform) {
      case 'ios':
      case 'android':
        return <Smartphone className="h-5 w-5" />;
      case 'desktop':
        return <Monitor className="h-5 w-5" />;
      default:
        return <Tablet className="h-5 w-5" />;
    }
  };

  if (!installPrompt || installPrompt.isInstalled || !installPrompt.canInstall) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {getIconForPlatform(installPrompt.platform)}
            <CardTitle className="text-lg">Install App</CardTitle>
          </div>
          {onDismiss && (
            <Button variant="ghost" size="sm" onClick={onDismiss}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Get the full app experience with offline access and faster loading
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Button 
            onClick={handleInstall} 
            disabled={isInstalling}
            className="flex-1"
          >
            {isInstalling ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isInstalling ? 'Installing...' : 'Install'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Update Notification Component
interface UpdateNotificationProps {
  onDismiss?: () => void;
  className?: string;
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({ onDismiss, className }) => {
  const [updateStatus, setUpdateStatus] = useState<PWAUpdateStatus | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    // Check for updates
    const checkUpdates = async () => {
      const status = await pwaService.checkForUpdates();
      setUpdateStatus(status);
    };

    checkUpdates();

    // Listen for update notifications
    const unsubscribe = pwaService.onUpdateStatusChange((status) => {
      setUpdateStatus(status);
    });

    return unsubscribe;
  }, []);

  const handleUpdate = async () => {
    if (!updateStatus?.updateAvailable) return;

    setIsUpdating(true);
    try {
      await pwaService.applyUpdate();
    } catch (error) {
      console.error('Update failed:', error);
      setIsUpdating(false);
    }
  };

  if (!updateStatus?.updateAvailable) {
    return null;
  }

  return (
    <Alert className={className}>
      <RefreshCw className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div>
          <strong>App Update Available</strong>
          <p className="text-sm text-muted-foreground">
            A new version is ready to install with improvements and bug fixes.
          </p>
        </div>
        <div className="flex gap-2 ml-4">
          <Button 
            size="sm" 
            onClick={handleUpdate} 
            disabled={isUpdating}
          >
            {isUpdating ? (
              <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <CheckCircle className="h-4 w-4 mr-1" />
            )}
            {isUpdating ? 'Updating...' : 'Update'}
          </Button>
          {onDismiss && (
            <Button variant="outline" size="sm" onClick={onDismiss}>
              Later
            </Button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
};

// Online Status Indicator
export const OnlineStatusIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(pwaService.isOnlineStatus());
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  return (
    <Badge 
      variant={isOnline ? "default" : "destructive"} 
      className={className}
    >
      {isOnline ? (
        <Wifi className="h-3 w-3 mr-1" />
      ) : (
        <WifiOff className="h-3 w-3 mr-1" />
      )}
      {isOnline ? 'Online' : 'Offline'}
    </Badge>
  );
};

// PWA Capabilities Display
export const PWACapabilitiesDisplay: React.FC<{ className?: string }> = ({ className }) => {
  const [capabilities, setCapabilities] = useState<PWACapabilities | null>(null);

  useEffect(() => {
    const caps = pwaService.getCapabilities();
    setCapabilities(caps);
  }, []);

  if (!capabilities) return null;

  const capabilityList = [
    { key: 'serviceWorker', label: 'Offline Support', icon: WifiOff },
    { key: 'pushNotifications', label: 'Push Notifications', icon: Bell },
    { key: 'installPrompt', label: 'App Installation', icon: Download },
    { key: 'sharing', label: 'Web Share', icon: Share2 },
    { key: 'fileHandling', label: 'File Handling', icon: Settings },
  ];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">App Capabilities</CardTitle>
        <CardDescription>
          Available features in your browser
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {capabilityList.map(({ key, label, icon: Icon }) => (
            <div key={key} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </div>
              <Badge variant={capabilities[key as keyof PWACapabilities] ? "default" : "secondary"}>
                {capabilities[key as keyof PWACapabilities] ? 'Supported' : 'Not Available'}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Installation Instructions
interface InstallInstructionsProps {
  onClose?: () => void;
  className?: string;
}

export const InstallInstructions: React.FC<InstallInstructionsProps> = ({ onClose, className }) => {
  const [instructions, setInstructions] = useState<{
    platform: string;
    instructions: string[];
    canPrompt: boolean;
  } | null>(null);

  useEffect(() => {
    const info = pwaService.getInstallInstructions();
    setInstructions(info);
  }, []);

  if (!instructions) return null;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Install Instructions</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          How to install this app on {instructions.platform}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ol className="space-y-2">
          {instructions.instructions.map((step, index) => (
            <li key={index} className="flex items-start gap-2">
              <Badge variant="outline" className="min-w-6 h-6 flex items-center justify-center text-xs">
                {index + 1}
              </Badge>
              <span className="text-sm">{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
};

// Share Button Component
interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  children?: React.ReactNode;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  title,
  text,
  url,
  children,
  variant = 'outline',
  size = 'default',
  className
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare('share' in navigator);
  }, []);

  const handleShare = async () => {
    if (!canShare) return;

    setIsSharing(true);
    try {
      await pwaService.shareContent({
        title: title || document.title,
        text: text || '',
        url: url || window.location.href
      });
    } catch (error) {
      console.error('Share failed:', error);
    } finally {
      setIsSharing(false);
    }
  };

  if (!canShare) return null;

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleShare}
      disabled={isSharing}
      className={className}
    >
      <Share2 className="h-4 w-4 mr-2" />
      {children || 'Share'}
    </Button>
  );
};

// Splash Screen Component
interface SplashScreenProps {
  isVisible: boolean;
  appName: string;
  appIcon?: string;
  loadingProgress?: number;
  className?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  isVisible,
  appName,
  appIcon = '/icons/icon-192x192.png',
  loadingProgress,
  className
}) => {
  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 bg-background z-50 flex items-center justify-center ${className}`}>
      <div className="text-center space-y-6 max-w-xs">
        <div className="flex justify-center">
          <img 
            src={appIcon} 
            alt={appName}
            className="w-24 h-24 rounded-2xl shadow-lg"
          />
        </div>
        
        <div>
          <h1 className="text-2xl font-bold text-foreground">{appName}</h1>
          <p className="text-muted-foreground mt-2">Loading your content...</p>
        </div>

        {loadingProgress !== undefined && (
          <div className="w-full">
            <Progress value={loadingProgress} className="w-full" />
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(loadingProgress)}% Complete
            </p>
          </div>
        )}

        {loadingProgress === undefined && (
          <div className="flex justify-center">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
};

// App Update Banner
interface AppUpdateBannerProps {
  version?: string;
  releaseNotes?: string[];
  onUpdate?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const AppUpdateBanner: React.FC<AppUpdateBannerProps> = ({
  version,
  releaseNotes,
  onUpdate,
  onDismiss,
  className
}) => {
  return (
    <Alert className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-start justify-between w-full">
          <div className="flex-1">
            <div className="font-medium">
              New Update Available {version && `(${version})`}
            </div>
            {releaseNotes && releaseNotes.length > 0 && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground mb-1">What's new:</p>
                <ul className="text-sm space-y-1">
                  {releaseNotes.slice(0, 3).map((note, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-muted-foreground">•</span>
                      <span>{note}</span>
                    </li>
                  ))}
                </ul>
                {releaseNotes.length > 3 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    +{releaseNotes.length - 3} more improvements
                  </p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2 ml-4">
            {onUpdate && (
              <Button size="sm" onClick={onUpdate}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Update
              </Button>
            )}
            {onDismiss && (
              <Button variant="outline" size="sm" onClick={onDismiss}>
                Later
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

// PWA Status Widget (for dashboard/settings)
export const PWAStatusWidget: React.FC<{ className?: string }> = ({ className }) => {
  const [installPrompt, setInstallPrompt] = useState<PWAInstallPrompt | null>(null);
  const [updateStatus, setUpdateStatus] = useState<PWAUpdateStatus | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Get initial status
    const prompt = pwaService.getInstallPrompt();
    setInstallPrompt(prompt);
    setIsOnline(pwaService.isOnlineStatus());

    // Check for updates
    pwaService.checkForUpdates().then(setUpdateStatus);

    // Set up listeners
    const unsubscribeUpdate = pwaService.onUpdateStatusChange(setUpdateStatus);

    const handleOnlineStatus = () => setIsOnline(pwaService.isOnlineStatus());
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);

    return () => {
      unsubscribeUpdate();
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Home className="h-5 w-5" />
          App Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm">Connection</span>
          <OnlineStatusIndicator />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm">Installation</span>
          <Badge variant={installPrompt?.isInstalled ? "default" : "secondary"}>
            {installPrompt?.isInstalled ? 'Installed' : 'Web App'}
          </Badge>
        </div>

        {updateStatus?.updateAvailable && (
          <div className="flex items-center justify-between">
            <span className="text-sm">Updates</span>
            <Badge variant="outline">
              <AlertCircle className="h-3 w-3 mr-1" />
              Available
            </Badge>
          </div>
        )}

        <div className="pt-2 border-t">
          <div className="flex gap-2">
            {installPrompt?.canInstall && (
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="h-4 w-4 mr-1" />
                Install
              </Button>
            )}
            {updateStatus?.updateAvailable && (
              <Button size="sm" variant="outline" className="flex-1">
                <RefreshCw className="h-4 w-4 mr-1" />
                Update
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 