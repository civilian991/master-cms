// ============================================================================
// MOBILE & PWA TYPE DEFINITIONS
// ============================================================================

// Core Mobile Types
export type MobileViewport = 'mobile' | 'tablet' | 'desktop';
export type TouchGestureType = 'tap' | 'double_tap' | 'long_press' | 'swipe' | 'pinch' | 'rotate';
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
export type NavigationType = 'tabs' | 'drawer' | 'stack' | 'modal';
export type ScreenOrientation = 'portrait' | 'landscape';
export type ConnectionType = 'wifi' | 'cellular' | 'ethernet' | 'bluetooth' | 'offline' | 'unknown';
export type NotificationPriority = 'default' | 'high' | 'low' | 'max' | 'min';
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed' | 'offline';
export type CacheStrategy = 'cache_first' | 'network_first' | 'cache_only' | 'network_only' | 'stale_while_revalidate';

// PWA Types
export type PWAInstallPrompt = 'auto' | 'manual' | 'dismissed' | 'installed';
export type ServiceWorkerState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant';
export type PushPermission = 'default' | 'granted' | 'denied';
export type NotificationAction = 'reply' | 'like' | 'share' | 'dismiss' | 'view' | 'edit';

// Device Types
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv' | 'watch' | 'unknown';
export type Platform = 'ios' | 'android' | 'windows' | 'macos' | 'linux' | 'web';
export type CameraFacing = 'user' | 'environment';
export type MediaType = 'photo' | 'video' | 'audio';
export type StorageType = 'localStorage' | 'sessionStorage' | 'indexedDB' | 'cache';

// ============================================================================
// CORE INTERFACES
// ============================================================================

export interface MobileDevice {
  id: string;
  type: DeviceType;
  platform: Platform;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  orientation: ScreenOrientation;
  viewport: MobileViewport;
  connectionType: ConnectionType;
  isOnline: boolean;
  batteryLevel?: number;
  isCharging?: boolean;
  touchSupport: boolean;
  hasCameraSupport: boolean;
  hasNotificationSupport: boolean;
  hasGeolocationSupport: boolean;
  hasVibrationSupport: boolean;
  capabilities: DeviceCapabilities;
  lastSeen: Date;
  registeredAt: Date;
}

export interface DeviceCapabilities {
  maxTouchPoints: number;
  hasAccelerometer: boolean;
  hasGyroscope: boolean;
  hasCompass: boolean;
  hasAmbientLight: boolean;
  hasProximity: boolean;
  hasWebGL: boolean;
  hasWebRTC: boolean;
  hasServiceWorker: boolean;
  hasIndexedDB: boolean;
  hasWebAssembly: boolean;
  hasClipboard: boolean;
  hasShare: boolean;
  hasWakeLock: boolean;
  hasVibration: boolean;
  maxStorageQuota: number;
  supportedMediaTypes: MediaType[];
}

export interface TouchGesture {
  id: string;
  type: TouchGestureType;
  startX: number;
  startY: number;
  endX?: number;
  endY?: number;
  deltaX?: number;
  deltaY?: number;
  distance?: number;
  angle?: number;
  duration: number;
  velocity?: number;
  pressure?: number;
  timestamp: Date;
  target: string;
  preventDefault?: boolean;
  stopPropagation?: boolean;
}

export interface MobileNavigation {
  type: NavigationType;
  currentScreen: string;
  history: NavigationHistoryItem[];
  canGoBack: boolean;
  canGoForward: boolean;
  tabs?: TabItem[];
  drawer?: DrawerItem[];
  modal?: ModalConfig;
  transitionConfig: TransitionConfig;
}

export interface NavigationHistoryItem {
  screen: string;
  params?: Record<string, any>;
  timestamp: Date;
  title?: string;
}

export interface TabItem {
  id: string;
  label: string;
  icon: string;
  screen: string;
  badge?: number;
  isActive: boolean;
  isEnabled: boolean;
}

export interface DrawerItem {
  id: string;
  label: string;
  icon: string;
  screen?: string;
  action?: string;
  children?: DrawerItem[];
  isExpanded?: boolean;
  isEnabled: boolean;
}

export interface ModalConfig {
  id: string;
  component: string;
  props?: Record<string, any>;
  dismissible: boolean;
  overlay: boolean;
  animation: string;
}

export interface TransitionConfig {
  type: 'slide' | 'fade' | 'scale' | 'flip' | 'none';
  duration: number;
  easing: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear';
  direction?: SwipeDirection;
}

// ============================================================================
// PWA INTERFACES
// ============================================================================

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser';
  orientation: 'any' | 'natural' | 'landscape' | 'portrait';
  theme_color: string;
  background_color: string;
  scope: string;
  icons: PWAIcon[];
  screenshots?: PWAScreenshot[];
  categories?: string[];
  lang: string;
  dir: 'ltr' | 'rtl' | 'auto';
  shortcuts?: PWAShortcut[];
  protocol_handlers?: PWAProtocolHandler[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'any' | 'maskable' | 'monochrome';
}

export interface PWAScreenshot {
  src: string;
  sizes: string;
  type: string;
  platform?: Platform;
  label?: string;
}

export interface PWAShortcut {
  name: string;
  url: string;
  description?: string;
  short_name?: string;
  icons?: PWAIcon[];
}

export interface PWAProtocolHandler {
  protocol: string;
  url: string;
}

export interface ServiceWorkerConfig {
  version: string;
  scope: string;
  cacheStrategies: CacheStrategyConfig[];
  backgroundSync: BackgroundSyncConfig;
  pushNotifications: PushNotificationConfig;
  periodicSync?: PeriodicSyncConfig;
  updatePolicy: 'immediate' | 'on_next_visit' | 'manual';
  skipWaiting: boolean;
  clientsClaim: boolean;
}

export interface CacheStrategyConfig {
  name: string;
  strategy: CacheStrategy;
  urlPattern: string;
  cacheName: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
  networkTimeoutSeconds?: number;
  plugins?: string[];
}

export interface BackgroundSyncConfig {
  enabled: boolean;
  syncTag: string;
  maxRetryTime: number;
  minSyncInterval: number;
  syncOnNetworkReconnect: boolean;
  powerConstraints: boolean;
}

export interface PushNotificationConfig {
  enabled: boolean;
  vapidPublicKey: string;
  userVisibleOnly: boolean;
  applicationServerKey: string;
  actions: NotificationActionConfig[];
  badge: string;
  icon: string;
  image?: string;
  silent: boolean;
  renotify: boolean;
  requireInteraction: boolean;
  ttl: number;
}

export interface NotificationActionConfig {
  action: NotificationAction;
  title: string;
  icon?: string;
  type?: 'button' | 'text';
  placeholder?: string;
}

export interface PeriodicSyncConfig {
  enabled: boolean;
  tag: string;
  minInterval: number;
  networkConstraints: boolean;
  batteryConstraints: boolean;
}

export interface PWAInstallState {
  isInstallable: boolean;
  isInstalled: boolean;
  installPrompt: PWAInstallPrompt;
  installEvent?: BeforeInstallPromptEvent;
  installSource?: 'browser' | 'homescreen' | 'store';
  lastPromptDate?: Date;
  promptDismissCount: number;
  installDate?: Date;
}

// ============================================================================
// OFFLINE & SYNC INTERFACES
// ============================================================================

export interface OfflineState {
  isOnline: boolean;
  lastOnlineTime: Date;
  connectionType: ConnectionType;
  effectiveType?: '2g' | '3g' | '4g' | '5g';
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
  pendingOperations: OfflineOperation[];
  syncQueue: SyncQueueItem[];
  conflictedItems: ConflictItem[];
  storageUsage: StorageUsage;
}

export interface OfflineOperation {
  id: string;
  type: 'create' | 'update' | 'delete' | 'upload';
  resource: string;
  resourceId: string;
  data: any;
  timestamp: Date;
  retryCount: number;
  maxRetries: number;
  priority: number;
  dependencies?: string[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

export interface SyncQueueItem {
  id: string;
  operation: OfflineOperation;
  scheduledAt: Date;
  lastAttempt?: Date;
  nextAttempt: Date;
  status: SyncStatus;
  progress?: number;
  estimatedCompletion?: Date;
}

export interface ConflictItem {
  id: string;
  resourceType: string;
  resourceId: string;
  localVersion: any;
  remoteVersion: any;
  conflictFields: string[];
  timestamp: Date;
  resolution?: 'local' | 'remote' | 'merge' | 'manual';
  isResolved: boolean;
}

export interface StorageUsage {
  total: number;
  used: number;
  available: number;
  quota: number;
  breakdown: {
    cache: number;
    indexedDB: number;
    localStorage: number;
    sessionStorage: number;
    webSQL?: number;
  };
  lastUpdated: Date;
}

// ============================================================================
// CAMERA & MEDIA INTERFACES
// ============================================================================

export interface CameraConfig {
  facing: CameraFacing;
  resolution: MediaResolution;
  quality: number; // 0-1
  format: 'jpeg' | 'png' | 'webp';
  enableFlash: boolean;
  enableZoom: boolean;
  enableFocus: boolean;
  enableStabilization: boolean;
  maxDuration?: number; // For video
  maxFileSize: number;
}

export interface MediaResolution {
  width: number;
  height: number;
  aspectRatio: string;
}

export interface CapturedMedia {
  id: string;
  type: MediaType;
  url: string;
  blob: Blob;
  filename: string;
  size: number;
  duration?: number; // For video/audio
  resolution?: MediaResolution;
  timestamp: Date;
  location?: GeolocationCoordinates;
  deviceInfo: string;
  metadata: MediaMetadata;
}

export interface MediaMetadata {
  title?: string;
  description?: string;
  tags?: string[];
  author?: string;
  copyright?: string;
  camera?: string;
  lens?: string;
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: string;
  exposure?: string;
  whiteBalance?: string;
  orientation?: number;
}

export interface VoiceRecording {
  id: string;
  audioBlob: Blob;
  duration: number;
  timestamp: Date;
  transcription?: string;
  confidence?: number;
  language: string;
  format: 'webm' | 'mp4' | 'wav' | 'mp3';
  bitrate: number;
  sampleRate: number;
  channels: number;
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  serviceURI?: string;
  grammars?: string[];
}

// ============================================================================
// NOTIFICATION INTERFACES
// ============================================================================

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: any;
  actions?: MobileNotificationAction[];
  timestamp: Date;
  priority: NotificationPriority;
  channel?: string;
  category?: string;
  sound?: string;
  vibrate?: number[];
  silent: boolean;
  sticky: boolean;
  requireInteraction: boolean;
  renotify: boolean;
  ttl: number;
  scheduledAt?: Date;
  expiresAt?: Date;
  clickAction?: string;
  isRead: boolean;
  isDelivered: boolean;
  deliveredAt?: Date;
  readAt?: Date;
}

export interface MobileNotificationAction {
  action: NotificationAction;
  title: string;
  icon?: string;
  type?: 'button' | 'text';
  placeholder?: string;
  inputs?: NotificationInput[];
}

export interface NotificationInput {
  name: string;
  type: 'text' | 'email' | 'number' | 'tel' | 'url';
  placeholder?: string;
  required?: boolean;
  maxLength?: number;
}

export interface PushSubscription {
  id: string;
  userId: string;
  deviceId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  userAgent: string;
  isActive: boolean;
  createdAt: Date;
  lastUsed: Date;
  notificationCount: number;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  enabled: boolean;
  channels: Record<string, boolean>;
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
  };
  frequency: 'realtime' | 'batched' | 'daily' | 'weekly';
  sounds: boolean;
  vibration: boolean;
  badgeCount: boolean;
}

// ============================================================================
// ANALYTICS INTERFACES
// ============================================================================

export interface MobileAnalytics {
  sessionId: string;
  userId?: string;
  deviceId: string;
  appVersion: string;
  platform: Platform;
  screenResolution: string;
  viewportSize: string;
  orientation: ScreenOrientation;
  connectionType: ConnectionType;
  sessionStart: Date;
  sessionEnd?: Date;
  sessionDuration?: number;
  pageViews: PageView[];
  interactions: UserInteraction[];
  performance: PerformanceMetrics;
  errors: ErrorReport[];
  crashes: CrashReport[];
}

export interface PageView {
  id: string;
  path: string;
  title: string;
  referrer?: string;
  timestamp: Date;
  duration?: number;
  scrollDepth: number;
  exitPath?: string;
  loadTime: number;
  renderTime: number;
  isOffline: boolean;
}

export interface UserInteraction {
  id: string;
  type: 'touch' | 'click' | 'swipe' | 'scroll' | 'voice' | 'shake';
  element: string;
  elementType: string;
  coordinates?: { x: number; y: number };
  gesture?: TouchGestureType;
  direction?: SwipeDirection;
  value?: any;
  timestamp: Date;
  duration?: number;
  page: string;
  context?: Record<string, any>;
}

export interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  cumulativeLayoutShift: number;
  firstInputDelay: number;
  timeToInteractive: number;
  memoryUsage?: number;
  cpuUsage?: number;
  batteryUsage?: number;
  networkRequests: number;
  cacheHitRate: number;
  offlineTime: number;
  syncTime: number;
}

export interface ErrorReport {
  id: string;
  type: 'javascript' | 'network' | 'service_worker' | 'security';
  message: string;
  stack?: string;
  filename?: string;
  lineNumber?: number;
  columnNumber?: number;
  userAgent: string;
  url: string;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  context: Record<string, any>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
}

export interface CrashReport {
  id: string;
  type: 'app_crash' | 'browser_crash' | 'service_worker_crash';
  reason: string;
  stackTrace?: string;
  memoryUsage?: number;
  openTabs?: number;
  lastActions: UserInteraction[];
  deviceInfo: MobileDevice;
  timestamp: Date;
  userId?: string;
  sessionId: string;
  isReported: boolean;
}

// ============================================================================
// API REQUEST/RESPONSE INTERFACES
// ============================================================================

export interface MobileApiRequest<T = any> {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: T;
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  offline?: boolean;
  priority?: 'low' | 'normal' | 'high';
  compression?: boolean;
}

export interface MobileApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode: number;
  headers: Record<string, string>;
  fromCache: boolean;
  timestamp: Date;
  duration: number;
  retryCount: number;
}

export interface OfflineSyncRequest {
  operations: OfflineOperation[];
  deviceId: string;
  lastSyncTime: Date;
  conflictResolution: 'client' | 'server' | 'manual';
  batchSize?: number;
}

export interface OfflineSyncResponse {
  success: boolean;
  syncedOperations: string[];
  failedOperations: SyncFailure[];
  conflicts: ConflictItem[];
  serverTime: Date;
  nextSyncTime?: Date;
}

export interface SyncFailure {
  operationId: string;
  error: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface NotificationSendRequest {
  recipients: string[];
  notification: Partial<MobileNotification>;
  scheduling?: {
    sendAt?: Date;
    timezone?: string;
    recurring?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      days?: number[];
      time: string;
    };
  };
  targeting?: {
    platforms?: Platform[];
    devices?: DeviceType[];
    locations?: string[];
    userSegments?: string[];
  };
}

export interface NotificationSendResponse {
  success: boolean;
  notificationId: string;
  recipients: {
    total: number;
    sent: number;
    failed: number;
    pending: number;
  };
  failedRecipients?: string[];
  scheduledAt?: Date;
}

// ============================================================================
// COMPONENT PROPS INTERFACES
// ============================================================================

export interface MobileAppProps {
  userId?: string;
  theme: 'light' | 'dark' | 'auto';
  initialScreen?: string;
  navigation: MobileNavigation;
  offline: OfflineState;
  onNavigate: (screen: string, params?: any) => void;
  onError: (error: ErrorReport) => void;
}

export interface MobileNavigationProps {
  type: NavigationType;
  currentScreen: string;
  tabs?: TabItem[];
  drawer?: DrawerItem[];
  onNavigate: (screen: string, params?: any) => void;
  onTabPress: (tabId: string) => void;
  onDrawerToggle: () => void;
  transition: TransitionConfig;
}

export interface TouchEditorProps {
  content: string;
  onChange: (content: string) => void;
  onSave: () => void;
  onVoiceInput: (text: string) => void;
  onMediaCapture: (media: CapturedMedia) => void;
  offline: boolean;
  autosave: boolean;
  voiceEnabled: boolean;
  cameraEnabled: boolean;
}

export interface CameraCaptureProps {
  config: CameraConfig;
  onCapture: (media: CapturedMedia) => void;
  onError: (error: string) => void;
  onCancel: () => void;
  overlay?: React.ComponentType;
  enablePreview: boolean;
  enableGallery: boolean;
}

export interface VoiceRecorderProps {
  language: string;
  onResult: (recording: VoiceRecording) => void;
  onTranscription: (text: string, confidence: number) => void;
  onError: (error: string) => void;
  continuous: boolean;
  interimResults: boolean;
  autoStart: boolean;
}

export interface OfflineManagerProps {
  state: OfflineState;
  onSync: () => void;
  onConflictResolve: (conflict: ConflictItem, resolution: any) => void;
  onStorageCleanup: () => void;
  showIndicator: boolean;
  showQueue: boolean;
}

export interface NotificationCenterProps {
  notifications: MobileNotification[];
  onNotificationClick: (notification: MobileNotification) => void;
  onNotificationDismiss: (notificationId: string) => void;
  onMarkAsRead: (notificationId: string) => void;
  onClearAll: () => void;
  groupByDate: boolean;
  showUnreadOnly: boolean;
}

export interface QuickActionsProps {
  actions: QuickAction[];
  onActionPress: (actionId: string) => void;
  onActionLongPress: (actionId: string) => void;
  visible: boolean;
  position: 'bottom' | 'top' | 'floating';
  hapticFeedback: boolean;
}

export interface QuickAction {
  id: string;
  label: string;
  icon: string;
  color?: string;
  badge?: number;
  isEnabled: boolean;
  requiresAuth?: boolean;
  shortcut?: string;
}

// ============================================================================
// HOOK INTERFACES
// ============================================================================

export interface UseMobileNavigationOptions {
  type: NavigationType;
  initialScreen?: string;
  persistState?: boolean;
  animateTransitions?: boolean;
}

export interface UseOfflineSyncOptions {
  autoSync?: boolean;
  syncInterval?: number;
  retryAttempts?: number;
  conflictStrategy?: 'client' | 'server' | 'manual';
}

export interface UsePushNotificationsOptions {
  enableOnMount?: boolean;
  requestPermission?: boolean;
  handleActions?: boolean;
  updateBadge?: boolean;
}

export interface UseDeviceFeaturesOptions {
  requestPermissions?: boolean;
  trackUsage?: boolean;
  enablePolyfills?: boolean;
}

export interface UseTouchGesturesOptions {
  enableSwipe?: boolean;
  enablePinch?: boolean;
  enableRotation?: boolean;
  enableLongPress?: boolean;
  threshold?: number;
  velocity?: number;
}

export interface UseMobileAnalyticsOptions {
  autoTrack?: boolean;
  trackPageViews?: boolean;
  trackInteractions?: boolean;
  trackPerformance?: boolean;
  trackErrors?: boolean;
}

// ============================================================================
// CONSTANTS AND UTILITIES
// ============================================================================

export const MOBILE_BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1200,
} as const;

export const TOUCH_GESTURES = {
  TAP: 'tap',
  DOUBLE_TAP: 'double_tap',
  LONG_PRESS: 'long_press',
  SWIPE: 'swipe',
  PINCH: 'pinch',
  ROTATE: 'rotate',
} as const;

export const NAVIGATION_TYPES = {
  TABS: 'tabs',
  DRAWER: 'drawer',
  STACK: 'stack',
  MODAL: 'modal',
} as const;

export const CONNECTION_TYPES = {
  WIFI: 'wifi',
  CELLULAR: 'cellular',
  ETHERNET: 'ethernet',
  BLUETOOTH: 'bluetooth',
  OFFLINE: 'offline',
  UNKNOWN: 'unknown',
} as const;

export const NOTIFICATION_PRIORITIES = {
  DEFAULT: 'default',
  HIGH: 'high',
  LOW: 'low',
  MAX: 'max',
  MIN: 'min',
} as const;

export const CACHE_STRATEGIES = {
  CACHE_FIRST: 'cache_first',
  NETWORK_FIRST: 'network_first',
  CACHE_ONLY: 'cache_only',
  NETWORK_ONLY: 'network_only',
  STALE_WHILE_REVALIDATE: 'stale_while_revalidate',
} as const;

export const PWA_DISPLAY_MODES = {
  STANDALONE: 'standalone',
  FULLSCREEN: 'fullscreen',
  MINIMAL_UI: 'minimal-ui',
  BROWSER: 'browser',
} as const;

export const DEFAULT_CACHE_CONFIG = {
  maxEntries: 50,
  maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
  networkTimeoutSeconds: 10,
} as const;

export const DEFAULT_SYNC_CONFIG = {
  maxRetryTime: 24 * 60 * 60 * 1000, // 24 hours
  minSyncInterval: 5 * 60 * 1000, // 5 minutes
  batchSize: 10,
} as const;

export const MOBILE_MEDIA_CONSTRAINTS = {
  photo: {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.8,
    format: 'jpeg' as const,
  },
  video: {
    maxWidth: 1280,
    maxHeight: 720,
    maxDuration: 300, // 5 minutes
    quality: 0.8,
    format: 'mp4' as const,
  },
  audio: {
    maxDuration: 600, // 10 minutes
    quality: 0.8,
    format: 'webm' as const,
  },
} as const;

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MobileEventHandler<T = any> = (event: T) => void;
export type TouchEventHandler = MobileEventHandler<TouchGesture>;
export type NavigationEventHandler = MobileEventHandler<{ screen: string; params?: any }>;
export type NotificationEventHandler = MobileEventHandler<MobileNotification>;
export type MediaCaptureHandler = MobileEventHandler<CapturedMedia>;
export type VoiceInputHandler = MobileEventHandler<VoiceRecording>;
export type ErrorHandler = MobileEventHandler<ErrorReport>;
export type SyncEventHandler = MobileEventHandler<SyncQueueItem>;

export type MobileScreenComponent = React.ComponentType<{
  navigation: MobileNavigation;
  params?: Record<string, any>;
  offline: OfflineState;
}>;

export type MobileMiddleware = (
  request: MobileApiRequest,
  next: (request: MobileApiRequest) => Promise<MobileApiResponse>
) => Promise<MobileApiResponse>;

export type PWAEventListener = (event: any) => void;

export type DeviceFeaturePermission = 
  | 'camera'
  | 'microphone'
  | 'geolocation'
  | 'notifications'
  | 'accelerometer'
  | 'gyroscope'
  | 'magnetometer'
  | 'ambient-light'
  | 'proximity';

export type OfflineStorageKey = `offline:${string}`;
export type CacheKey = `cache:${string}:${string}`;
export type SyncQueueKey = `sync:${string}`;

export default {}; 