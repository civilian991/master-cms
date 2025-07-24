"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Skeleton, 
  SkeletonTable, 
  SkeletonCard, 
  SkeletonForm, 
  SkeletonList, 
  LoadingButton 
} from '@/components/ui/skeleton'
import { 
  RefreshCw,
  Download,
  Save,
  Send,
  Play,
  Pause,
  Settings,
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Clock,
  Activity,
  Zap
} from 'lucide-react'

export default function LoadingStatesDemo() {
  const [loading, setLoading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  // Simulate loading states
  const handleLoadingDemo = async (duration: number = 2000) => {
    setLoading(true)
    await new Promise(resolve => setTimeout(resolve, duration))
    setLoading(false)
  }

  // Simulate download progress
  const handleDownload = async () => {
    setDownloadProgress(0)
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 20
      })
    }, 200)
  }

  // Auto-reset download progress
  useEffect(() => {
    if (downloadProgress >= 100) {
      const timer = setTimeout(() => setDownloadProgress(0), 2000)
      return () => clearTimeout(timer)
    }
  }, [downloadProgress])

  return (
    <div className="min-h-screen bg-gray-25 animate-[fadeIn_0.5s_ease-out]">
      <div className="p-6 space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 animate-[slideInDown_0.6s_ease-out]">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-display text-gray-900">Loading States & Animations</h1>
            <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
              Epic 11.5
            </Badge>
          </div>
          <p className="text-body text-gray-600 max-w-2xl mx-auto">
            Sophisticated skeleton screens, shimmer animations, and micro-interactions with 60fps performance
          </p>
        </div>

        {/* Control Panel */}
        <Card className="border-0 shadow-soft bg-gradient-subtle animate-[slideInUp_0.7s_ease-out]">
          <CardHeader>
            <CardTitle className="text-heading flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Settings className="h-5 w-5 text-blue-600" />
              </div>
              Animation Controls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <LoadingButton
                onClick={() => handleLoadingDemo(1500)}
                loading={loading}
                loadingText="Loading..."
                className="bg-gradient-brand"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Trigger Loading State
              </LoadingButton>

              <LoadingButton
                variant="outline"
                onClick={handleDownload}
                loading={downloadProgress > 0 && downloadProgress < 100}
                loadingText={`${Math.round(downloadProgress)}%`}
                className="shadow-soft"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Progress
              </LoadingButton>

              <Button
                variant="outline"
                onClick={() => setIsAnimating(!isAnimating)}
                className="shadow-soft hover:shadow-medium transition-all duration-200"
              >
                {isAnimating ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isAnimating ? 'Pause' : 'Play'} Animations
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Skeleton Components Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Enhanced Skeleton Cards */}
          <div className="space-y-6 animate-[slideInLeft_0.8s_ease-out]">
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-600" />
                  </div>
                  Skeleton Cards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {loading ? (
                  <>
                    <SkeletonCard 
                      showImage={true}
                      showTitle={true}
                      showDescription={true}
                      showActions={true}
                      className="animate-[scaleIn_0.5s_ease-out]"
                    />
                    <SkeletonCard 
                      showImage={false}
                      showTitle={true}
                      showDescription={true}
                      showActions={true}
                      className="animate-[scaleIn_0.5s_ease-out_0.1s_both]"
                    />
                  </>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4 animate-[fadeIn_0.5s_ease-out] hover:shadow-medium transition-all duration-200">
                      <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <Activity className="h-12 w-12 text-white" />
                      </div>
                      <h3 className="text-heading text-gray-900">Sample Article</h3>
                      <p className="text-body text-gray-600">
                        This is a sample article card that appears after loading completes.
                        The transition from skeleton to content is smooth and professional.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="shadow-soft">Read More</Button>
                        <Button variant="outline" size="sm" className="shadow-soft">Share</Button>
                      </div>
                    </div>
                    
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 space-y-4 animate-[fadeIn_0.5s_ease-out_0.1s_both] hover:shadow-medium transition-all duration-200">
                      <h3 className="text-heading text-gray-900">Another Article</h3>
                      <p className="text-body text-gray-600">
                        Multiple cards can animate in sequence for a polished loading experience.
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="shadow-soft">Read More</Button>
                        <Button variant="outline" size="sm" className="shadow-soft">Share</Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skeleton Forms */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  Skeleton Forms
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonForm 
                    fields={4} 
                    layout="double" 
                    showButtons={true}
                    className="animate-[scaleIn_0.5s_ease-out]"
                  />
                ) : (
                  <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-caption font-medium text-gray-700">First Name</label>
                        <input 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-brand-500 focus:ring-brand-500/20 transition-all duration-200"
                          placeholder="John"
                          value="John"
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-caption font-medium text-gray-700">Last Name</label>
                        <input 
                          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-brand-500 focus:ring-brand-500/20 transition-all duration-200"
                          placeholder="Doe"
                          value="Doe"
                          readOnly
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-caption font-medium text-gray-700">Email</label>
                      <input 
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:border-brand-500 focus:ring-brand-500/20 transition-all duration-200"
                        placeholder="john@example.com"
                        value="john@example.com"
                        readOnly
                      />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-100">
                      <Button className="bg-gradient-brand shadow-soft">Save Changes</Button>
                      <Button variant="outline" className="shadow-soft">Cancel</Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Skeleton Tables and Lists */}
          <div className="space-y-6 animate-[slideInRight_0.8s_ease-out]">
            {/* Data Tables */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-4 w-4 text-orange-600" />
                  </div>
                  Skeleton Tables
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonTable 
                    rows={5} 
                    columns={4} 
                    showHeader={true}
                    className="animate-[scaleIn_0.5s_ease-out]"
                  />
                ) : (
                  <div className="animate-[fadeIn_0.5s_ease-out]">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                          <th className="p-4 text-left text-caption font-semibold text-gray-700">Name</th>
                          <th className="p-4 text-left text-caption font-semibold text-gray-700">Status</th>
                          <th className="p-4 text-left text-caption font-semibold text-gray-700">Role</th>
                          <th className="p-4 text-left text-caption font-semibold text-gray-700">Updated</th>
                        </tr>
                      </thead>
                      <tbody>
                        {['John Doe', 'Jane Smith', 'Mike Johnson', 'Sarah Wilson', 'Tom Brown'].map((name, index) => (
                          <tr 
                            key={name} 
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-all duration-200 animate-[slideInLeft_0.5s_ease-out]"
                            style={{ animationDelay: `${index * 0.1}s` }}
                          >
                            <td className="p-4 text-body text-gray-900">{name}</td>
                            <td className="p-4">
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Active
                              </Badge>
                            </td>
                            <td className="p-4 text-body text-gray-900">Editor</td>
                            <td className="p-4 text-caption text-gray-600">2 hours ago</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skeleton Lists */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="text-heading flex items-center gap-2">
                  <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-4 w-4 text-teal-600" />
                  </div>
                  Skeleton Lists
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <SkeletonList 
                    items={4} 
                    showAvatar={true} 
                    showMetadata={true}
                    className="animate-[scaleIn_0.5s_ease-out]"
                  />
                ) : (
                  <div className="space-y-4 animate-[fadeIn_0.5s_ease-out]">
                    {[
                      { name: 'Project Alpha', status: 'In Progress', time: '2 hours ago', color: 'blue' },
                      { name: 'Website Redesign', status: 'Review', time: '1 day ago', color: 'yellow' },
                      { name: 'API Documentation', status: 'Complete', time: '3 days ago', color: 'green' },
                      { name: 'User Testing', status: 'Planning', time: '1 week ago', color: 'purple' }
                    ].map((item, index) => (
                      <div 
                        key={item.name}
                        className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 shadow-soft hover:shadow-medium animate-[slideInUp_0.5s_ease-out]"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className={`w-12 h-12 bg-${item.color}-100 rounded-full flex items-center justify-center`}>
                          <FileText className={`h-5 w-5 text-${item.color}-600`} />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h4 className="text-body font-medium text-gray-900">{item.name}</h4>
                          <p className="text-caption text-gray-600">{item.status} • {item.time}</p>
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <TrendingUp className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Micro-interactions Showcase */}
        <Card className="border-0 shadow-soft bg-gradient-subtle animate-[slideInUp_1s_ease-out]">
          <CardHeader>
            <CardTitle className="text-heading flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Zap className="h-5 w-5 text-yellow-600" />
              </div>
              Micro-interactions & Button States
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Loading Buttons */}
              <div className="space-y-4">
                <h4 className="text-caption font-semibold text-gray-700">Loading States</h4>
                <div className="space-y-3">
                  <LoadingButton
                    loading={true}
                    loadingText="Saving..."
                    className="w-full bg-gradient-brand"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </LoadingButton>
                  
                  <LoadingButton
                    variant="outline"
                    loading={downloadProgress > 0 && downloadProgress < 100}
                    loadingText={`${Math.round(downloadProgress)}%`}
                    className="w-full shadow-soft"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </LoadingButton>
                </div>
              </div>

              {/* Hover Effects */}
              <div className="space-y-4">
                <h4 className="text-caption font-semibold text-gray-700">Hover Effects</h4>
                <div className="space-y-3">
                  <Button className="w-full shadow-soft hover:shadow-medium hover:scale-105 transition-all duration-200">
                    <Send className="h-4 w-4 mr-2" />
                    Scale on Hover
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    className="w-full shadow-soft hover:shadow-medium hover:border-brand-400 transition-all duration-200"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Border Transition
                  </Button>
                </div>
              </div>

              {/* Pulse Effects */}
              <div className="space-y-4">
                <h4 className="text-caption font-semibold text-gray-700">Pulse Animations</h4>
                <div className="space-y-3">
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-caption text-gray-700">Live Status</span>
                    </div>
                  </div>
                  
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center animate-[pulse-soft_2s_infinite]">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <span className="text-caption text-gray-700">Soft Pulse</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Indicators */}
              <div className="space-y-4">
                <h4 className="text-caption font-semibold text-gray-700">Progress</h4>
                <div className="space-y-3">
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-soft">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-caption text-gray-700">Upload</span>
                        <span className="text-caption text-gray-500">{Math.round(downloadProgress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-brand h-2 rounded-full transition-all duration-300"
                          style={{ width: `${downloadProgress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="w-full p-4 bg-white border border-gray-200 rounded-lg shadow-soft">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 border-2 border-brand-600 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-caption text-gray-700">Processing</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Notice */}
        <Card className="border-0 shadow-soft bg-gradient-to-r from-green-50 to-blue-50 animate-[slideInUp_1.2s_ease-out]">
          <CardContent className="p-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-heading text-gray-900">60fps Performance</h3>
              <p className="text-body text-gray-600 max-w-2xl mx-auto">
                All animations are GPU-accelerated using transform and opacity properties, 
                ensuring smooth 60fps performance across all devices. CSS animations are preferred 
                over JavaScript for optimal performance.
              </p>
              <div className="flex justify-center gap-4 text-caption text-gray-600">
                <span>✓ GPU Accelerated</span>
                <span>✓ Reduced Motion Support</span>
                <span>✓ 60fps Smooth</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 