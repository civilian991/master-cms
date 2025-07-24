'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { 
  Share, 
  Twitter, 
  Facebook, 
  Linkedin, 
  Mail,
  Copy,
  QrCode,
  Download,
  MessageSquare,
  Send,
  Globe,
  Bookmark,
  Eye,
  TrendingUp,
  Users,
  Calendar,
  ExternalLink
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface SharingStats {
  totalShares: number
  platforms: {
    name: string
    count: number
    icon: React.ReactNode
    growth: number
  }[]
  recentShares: {
    platform: string
    timestamp: string
    location?: string
  }[]
}

interface SocialSharingProps {
  articleId: string
  title: string
  excerpt: string
  url: string
  author: string
  featuredImage?: string
  category: string
  tags: string[]
  showStats?: boolean
  showCustomization?: boolean
  className?: string
}

export function SocialSharing({
  articleId,
  title,
  excerpt,
  url,
  author,
  featuredImage,
  category,
  tags,
  showStats = true,
  showCustomization = true,
  className
}: SocialSharingProps) {
  const [customMessage, setCustomMessage] = useState(title)
  const [customHashtags, setCustomHashtags] = useState(tags.join(' '))
  const [copySuccess, setCopySuccess] = useState(false)
  const [sharingStats, setSharingStats] = useState<SharingStats | null>(null)
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['twitter', 'linkedin', 'facebook'])

  useEffect(() => {
    loadSharingStats()
  }, [articleId])

  const loadSharingStats = async () => {
    if (!showStats) return
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const mockStats: SharingStats = {
        totalShares: 247,
        platforms: [
          {
            name: 'Twitter',
            count: 89,
            icon: <Twitter className="h-4 w-4" />,
            growth: 15.3
          },
          {
            name: 'LinkedIn',
            count: 76,
            icon: <Linkedin className="h-4 w-4" />,
            growth: 22.1
          },
          {
            name: 'Facebook',
            count: 52,
            icon: <Facebook className="h-4 w-4" />,
            growth: 8.7
          },
          {
            name: 'Email',
            count: 23,
            icon: <Mail className="h-4 w-4" />,
            growth: 5.2
          },
          {
            name: 'Direct',
            count: 7,
            icon: <Copy className="h-4 w-4" />,
            growth: -2.1
          }
        ],
        recentShares: [
          { platform: 'Twitter', timestamp: '2 hours ago', location: 'San Francisco, CA' },
          { platform: 'LinkedIn', timestamp: '5 hours ago', location: 'New York, NY' },
          { platform: 'Facebook', timestamp: '1 day ago', location: 'London, UK' }
        ]
      }
      
      setSharingStats(mockStats)
    } catch (error) {
      console.error('Error loading sharing stats:', error)
    }
  }

  const generateShareUrls = () => {
    const encodedUrl = encodeURIComponent(url)
    const encodedTitle = encodeURIComponent(customMessage)
    const encodedExcerpt = encodeURIComponent(excerpt)
    const hashtags = customHashtags.replace(/\s+/g, ',')
    
    return {
      twitter: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}&summary=${encodedExcerpt}`,
      whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
      reddit: `https://reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
      email: `mailto:?subject=${encodedTitle}&body=${encodedExcerpt}%0A%0A${encodedUrl}`
    }
  }

  const handleShare = async (platform: string) => {
    const shareUrls = generateShareUrls()
    const shareUrl = shareUrls[platform as keyof typeof shareUrls]
    
    if (shareUrl) {
      // Track sharing event
      try {
        await fetch('/api/analytics/share', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            articleId,
            platform,
            url: shareUrl
          })
        })
      } catch (error) {
        console.error('Error tracking share:', error)
      }
      
      // Open share window
      window.open(shareUrl, '_blank', 'width=600,height=400,scrollbars=yes,resizable=yes')
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopySuccess(true)
      
      // Track copy event
      await fetch('/api/analytics/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          platform: 'copy',
          url
        })
      })
      
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Error copying to clipboard:', error)
    }
  }

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: customMessage,
          text: excerpt,
          url: url
        })
      } catch (error) {
        console.error('Error sharing:', error)
      }
    }
  }

  const platforms = [
    {
      id: 'twitter',
      name: 'Twitter',
      icon: <Twitter className="h-4 w-4" />,
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      description: 'Share on Twitter'
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: <Linkedin className="h-4 w-4" />,
      color: 'bg-blue-700 hover:bg-blue-800 text-white',
      description: 'Share on LinkedIn'
    },
    {
      id: 'facebook',
      name: 'Facebook',
      icon: <Facebook className="h-4 w-4" />,
      color: 'bg-blue-600 hover:bg-blue-700 text-white',
      description: 'Share on Facebook'
    },
    {
      id: 'whatsapp',
      name: 'WhatsApp',
      icon: <MessageSquare className="h-4 w-4" />,
      color: 'bg-green-500 hover:bg-green-600 text-white',
      description: 'Share on WhatsApp'
    },
    {
      id: 'telegram',
      name: 'Telegram',
      icon: <Send className="h-4 w-4" />,
      color: 'bg-blue-500 hover:bg-blue-600 text-white',
      description: 'Share on Telegram'
    },
    {
      id: 'reddit',
      name: 'Reddit',
      icon: <Globe className="h-4 w-4" />,
      color: 'bg-orange-500 hover:bg-orange-600 text-white',
      description: 'Share on Reddit'
    },
    {
      id: 'email',
      name: 'Email',
      icon: <Mail className="h-4 w-4" />,
      color: 'bg-gray-600 hover:bg-gray-700 text-white',
      description: 'Share via Email'
    }
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Share className="h-5 w-5" />
            Share Article
          </CardTitle>
          {sharingStats && (
            <Badge variant="secondary">
              <TrendingUp className="h-3 w-3 mr-1" />
              {sharingStats.totalShares} shares
            </Badge>
          )}
        </div>
        <CardDescription>
          Spread the word about this insightful article
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="quick" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick">Quick Share</TabsTrigger>
            {showCustomization && (
              <TabsTrigger value="customize">Customize</TabsTrigger>
            )}
            {showStats && sharingStats && (
              <TabsTrigger value="stats">Stats</TabsTrigger>
            )}
          </TabsList>
          
          <TabsContent value="quick" className="space-y-4">
            {/* Quick Share Buttons */}
            <div className="grid grid-cols-2 gap-2">
              {platforms.filter(p => selectedPlatforms.includes(p.id)).map((platform) => (
                <Button
                  key={platform.id}
                  onClick={() => handleShare(platform.id)}
                  className={cn("justify-start", platform.color)}
                  variant="outline"
                >
                  {platform.icon}
                  <span className="ml-2">{platform.name}</span>
                </Button>
              ))}
            </div>
            
            {/* Copy Link */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Direct Link</label>
              <div className="flex gap-2">
                <Input value={url} readOnly className="flex-1" />
                <Button
                  onClick={handleCopyLink}
                  variant={copySuccess ? 'default' : 'outline'}
                  className="px-3"
                >
                  <Copy className="h-4 w-4" />
                  {copySuccess && <span className="ml-2">Copied!</span>}
                </Button>
              </div>
            </div>
            
            {/* Native Share */}
            {typeof navigator !== 'undefined' && navigator.share && (
              <Button
                onClick={handleNativeShare}
                variant="outline"
                className="w-full"
              >
                <Share className="h-4 w-4 mr-2" />
                Use Device Share Menu
              </Button>
            )}
          </TabsContent>
          
          {showCustomization && (
            <TabsContent value="customize" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Custom Message</label>
                  <Textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder="Customize your share message..."
                    className="min-h-[80px]"
                  />
                  <span className="text-xs text-muted-foreground">
                    {customMessage.length}/280 characters
                  </span>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Hashtags</label>
                  <Input
                    value={customHashtags}
                    onChange={(e) => setCustomHashtags(e.target.value)}
                    placeholder="Add relevant hashtags..."
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Platforms</label>
                  <div className="grid grid-cols-2 gap-2">
                    {platforms.map((platform) => (
                      <Button
                        key={platform.id}
                        variant={selectedPlatforms.includes(platform.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setSelectedPlatforms(prev =>
                            prev.includes(platform.id)
                              ? prev.filter(p => p !== platform.id)
                              : [...prev, platform.id]
                          )
                        }}
                        className="justify-start"
                      >
                        {platform.icon}
                        <span className="ml-2">{platform.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-3">Preview</h4>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <div className="font-medium text-sm">{customMessage}</div>
                    <div className="text-xs text-muted-foreground">{excerpt}</div>
                    <div className="text-xs text-primary">{url}</div>
                    {customHashtags && (
                      <div className="text-xs text-blue-600">
                        {customHashtags.split(' ').map(tag => `#${tag}`).join(' ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>
          )}
          
          {showStats && sharingStats && (
            <TabsContent value="stats" className="space-y-4">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">{sharingStats.totalShares}</div>
                    <div className="text-xs text-muted-foreground">Total Shares</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold">
                      {Math.round(sharingStats.platforms.reduce((sum, p) => sum + p.growth, 0) / sharingStats.platforms.length)}%
                    </div>
                    <div className="text-xs text-muted-foreground">Avg. Growth</div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Platform Breakdown</h4>
                  {sharingStats.platforms.map((platform) => (
                    <div key={platform.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {platform.icon}
                        <span className="text-sm">{platform.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full" 
                            style={{ width: `${(platform.count / sharingStats.totalShares) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8">{platform.count}</span>
                        <Badge 
                          variant={platform.growth > 0 ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {platform.growth > 0 ? '+' : ''}{platform.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Recent Activity
                  </h4>
                  {sharingStats.recentShares.map((share, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span>{share.platform}</span>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span>{share.timestamp}</span>
                        {share.location && (
                          <>
                            <span>•</span>
                            <span>{share.location}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        {/* Additional Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                More Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>
                <QrCode className="h-4 w-4 mr-2" />
                Generate QR Code
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Bookmark className="h-4 w-4 mr-2" />
                Save for Later
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <ExternalLink className="h-4 w-4 mr-2" />
                Open in New Tab
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <div className="text-xs text-muted-foreground ml-auto">
            <Users className="h-3 w-3 inline mr-1" />
            Help others discover great content
          </div>
        </div>
      </CardContent>
    </Card>
  )
}