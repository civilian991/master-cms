import React from 'react';
import { Metadata } from 'next';
import { Container, Section, Grid, GridItem } from '@/components/ui/layout';
import { ReadingAnalyticsPanel } from '@/components/analytics/ReadingAnalyticsPanel';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Target,
  Award,
  Calendar,
  Clock,
  BookOpen,
  Zap,
  Flame,
  Users
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Reading Analytics | Dashboard',
  description: 'Comprehensive insights into your reading habits, goals, and progress.',
};

export default function AnalyticsPage() {
  // Mock data for overview cards
  const overviewStats = [
    {
      title: 'Total Reading Time',
      value: '47h 32m',
      change: '+12%',
      changeType: 'positive' as const,
      icon: <Clock className="h-4 w-4" />,
      description: 'This month'
    },
    {
      title: 'Articles Completed',
      value: '89',
      change: '+23%',
      changeType: 'positive' as const,
      icon: <BookOpen className="h-4 w-4" />,
      description: 'This month'
    },
    {
      title: 'Reading Speed',
      value: '245 WPM',
      change: '+15 WPM',
      changeType: 'positive' as const,
      icon: <Zap className="h-4 w-4" />,
      description: 'Average speed'
    },
    {
      title: 'Current Streak',
      value: '12 days',
      change: 'Personal best!',
      changeType: 'neutral' as const,
      icon: <Flame className="h-4 w-4" />,
      description: 'Daily reading'
    },
    {
      title: 'Goals Completed',
      value: '7/10',
      change: '70%',
      changeType: 'positive' as const,
      icon: <Target className="h-4 w-4" />,
      description: 'This month'
    },
    {
      title: 'Achievements',
      value: '23',
      change: '+3 this week',
      changeType: 'positive' as const,
      icon: <Award className="h-4 w-4" />,
      description: 'Unlocked badges'
    }
  ];

  const getChangeColor = (type: 'positive' | 'negative' | 'neutral') => {
    switch (type) {
      case 'positive': return 'text-green-600'
      case 'negative': return 'text-red-600'
      default: return 'text-blue-600'
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Header */}
      <Section background="muted" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Reading Analytics
              </h1>
              <p className="text-muted-foreground">
                Comprehensive insights into your reading habits and progress
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                <TrendingUp className="h-3 w-3 mr-1" />
                All-time high activity
              </Badge>
              <Badge variant="outline">
                <Calendar className="h-3 w-3 mr-1" />
                Updated live
              </Badge>
            </div>
          </div>
        </Container>
      </Section>

      {/* Overview Statistics */}
      <Section background="default" spacing={{ top: 'lg', bottom: 'md' }}>
        <Container>
          <Grid cols={1} responsive={{ md: 2, lg: 3 }} gap="lg">
            {overviewStats.map((stat, index) => (
              <GridItem key={index}>
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {stat.icon}
                          <span>{stat.title}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-2xl font-bold">{stat.value}</div>
                          <div className="text-xs text-muted-foreground">{stat.description}</div>
                        </div>
                      </div>
                      <div className={`text-sm font-medium ${getChangeColor(stat.changeType)}`}>
                        {stat.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </GridItem>
            ))}
          </Grid>
        </Container>
      </Section>

      {/* Main Analytics Panel */}
      <Section background="default" spacing={{ top: 'none', bottom: 'xl' }}>
        <Container>
          <Grid cols={1} gap="lg">
            <GridItem>
              <ReadingAnalyticsPanel
                userId="current-user"
                timeframe="30d"
              />
            </GridItem>
          </Grid>
        </Container>
      </Section>

      {/* Additional Insights */}
      <Section background="muted" spacing={{ top: 'lg', bottom: 'xl' }}>
        <Container>
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Reading Insights
            </h2>
            <p className="text-muted-foreground">
              Discover patterns and improve your reading experience
            </p>
          </div>
          
          <Grid cols={1} responsive={{ md: 2 }} gap="lg">
            <GridItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Reading Patterns
                  </CardTitle>
                  <CardDescription>
                    Your most productive reading times
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Peak Hours</span>
                      <Badge variant="secondary">8-10 AM, 8-10 PM</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Best Day</span>
                      <Badge variant="secondary">Sundays</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Avg Session</span>
                      <Badge variant="secondary">23 minutes</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <Badge className="bg-green-500">85%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
            
            <GridItem>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Community Comparison
                  </CardTitle>
                  <CardDescription>
                    How you compare to other readers
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Reading Speed</span>
                      <Badge className="bg-blue-500">78th percentile</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Completion Rate</span>
                      <Badge className="bg-green-500">82nd percentile</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Engagement</span>
                      <Badge className="bg-purple-500">89th percentile</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Streak Length</span>
                      <Badge className="bg-orange-500">Top 15%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </GridItem>
          </Grid>
        </Container>
      </Section>
    </div>
  );
}