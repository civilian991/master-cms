import React from "react";
import { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

// Icon size variants as per design system specification
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl" | "2xl";

// Icon size mapping with consistent 4px scaling
const iconSizes: Record<IconSize, number> = {
  xs: 12,   // 12px - Extra small inline icons
  sm: 16,   // 16px - Small inline icons  
  md: 20,   // 20px - Medium icons
  lg: 24,   // 24px - Default size
  xl: 32,   // 32px - Large icons
  "2xl": 48, // 48px - Extra large icons
};

// Extended icon props for our design system
export interface DesignSystemIconProps extends Omit<LucideProps, "size"> {
  /**
   * Icon component from lucide-react
   */
  icon: React.ComponentType<LucideProps>;
  
  /**
   * Icon size variant - defaults to 'lg' (24px)
   */
  size?: IconSize;
  
  /**
   * Icon stroke width - defaults to 1.5
   */
  strokeWidth?: number;
  
  /**
   * Whether the icon should inherit site-specific accent color
   */
  accent?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Semantic role for accessibility
   */
  role?: string;
  
  /**
   * Accessible label for screen readers
   */
  "aria-label"?: string;
}

/**
 * Design System Icon Component
 * 
 * Provides consistent sizing, stroke width, and theming for Lucide Icons
 * across all four sites with site-specific accent color support.
 */
export const Icon: React.FC<DesignSystemIconProps> = ({ 
  icon: IconComponent, 
  size = "lg", 
  strokeWidth = 1.5,
  accent = false,
  className,
  role = "img",
  "aria-label": ariaLabel,
  ...props 
}) => {
  const iconSize = iconSizes[size];
  
  return (
    <IconComponent
      {...props}
      size={iconSize}
      strokeWidth={strokeWidth}
      role={role}
      aria-label={ariaLabel}
      className={cn(
        // Base styles
        "inline-flex shrink-0",
        // Site-specific accent color when enabled
        accent ? "text-primary" : "text-current",
        className
      )}
    />
  );
};

Icon.displayName = "Icon";

// Convenience components for common icon patterns
export const NavigationIcon: React.FC<Omit<DesignSystemIconProps, "size">> = (props) => 
  <Icon {...props} size="md" />;

export const ButtonIcon: React.FC<Omit<DesignSystemIconProps, "size">> = (props) => 
  <Icon {...props} size="sm" />;

export const ContentIcon: React.FC<Omit<DesignSystemIconProps, "size">> = (props) => 
  <Icon {...props} size="lg" />;

export const HeroIcon: React.FC<Omit<DesignSystemIconProps, "size">> = (props) => 
  <Icon {...props} size="2xl" />;

// Icon collection re-exports for easy access - using lucide-react equivalents
export {
  // Navigation icons
  Home as House,
  FileText as Article,
  User,
  Search as MagnifyingGlass,
  Bell,
  Settings as Gear,
  LogOut as SignOut,
  LogIn as SignIn,
  Menu as List,
  X,
  ChevronDown as CaretDown,
  ChevronUp as CaretUp,
  ChevronLeft as CaretLeft,
  ChevronRight as CaretRight,
  ArrowLeft,
  
  // Content icons
  Heart,
  Share,
  Bookmark as BookmarkSimple,
  MessageCircle as ChatCircle,
  Eye,
  Calendar,
  Clock,
  Tag,
  Folder,
  File,
  Image,
  Video as VideoCamera,
  Mic as Microphone,
  
  // Action icons
  Plus,
  Minus,
  Edit as Pencil,
  Trash,
  Check,
  AlertTriangle as Warning,
  Info,
  HelpCircle as Question,
  Download,
  Upload,
  Copy,
  Link,
  
  // Social icons
  Twitter as TwitterLogo,
  Facebook as FacebookLogo,
  Instagram as InstagramLogo,
  Linkedin as LinkedinLogo,
  Youtube as YoutubeLogo,
  Github as GithubLogo,
  
  // UI state icons
  Loader as Spinner,
  CheckCircle,
  XCircle,
  AlertCircle as WarningCircle,
} from "lucide-react"; 