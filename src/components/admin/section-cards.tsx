import { TrendingDown, TrendingUp, Users, FileText, Globe, Eye } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function SectionCards() {
  return (
    <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader>
          <CardDescription>Total Articles</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            1,247
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3" />
              +12.5%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Published this month <TrendingUp className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground">
            Content creation trending up
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Active Users</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            856
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3" />
              +8.2%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            New registrations <Users className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground">
            User engagement is strong
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Total Sites</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            23
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingUp className="h-3 w-3" />
              +4
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Sites deployed <Globe className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground">
            Multi-site expansion
          </div>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Page Views</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums">
            45.2K
          </CardTitle>
          <CardAction>
            <Badge variant="outline">
              <TrendingDown className="h-3 w-3" />
              -2.1%
            </Badge>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Monthly traffic <Eye className="h-4 w-4" />
          </div>
          <div className="text-muted-foreground">
            Slight decline this period
          </div>
        </CardFooter>
      </Card>
    </div>
  )
} 