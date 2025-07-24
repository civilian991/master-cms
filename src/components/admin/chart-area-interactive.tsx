"use client"

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ChartAreaInteractive() {
  return (
    <Card className="@container/card">
      <CardHeader>
        <CardTitle>Content Performance</CardTitle>
        <CardDescription>
          Article views and engagement over time
        </CardDescription>
        <CardAction>
          <Select defaultValue="30d">
            <SelectTrigger className="w-40" size="sm">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
        </CardAction>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {/* Placeholder for chart - would integrate with recharts when available */}
        <div className="aspect-auto h-[250px] w-full bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-950 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
              📊
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Analytics Chart
            </p>
            <p className="text-xs text-muted-foreground">
              Chart integration pending
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 