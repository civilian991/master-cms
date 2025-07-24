"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2,
  FileText,
  Calendar,
  User 
} from "lucide-react"

// Mock data for articles
const articles = [
  {
    id: 1,
    title: "Getting Started with Next.js 15",
    author: "John Doe",
    status: "published",
    views: 1250,
    date: "2024-01-10",
    category: "Tutorial"
  },
  {
    id: 2,
    title: "Advanced TypeScript Patterns",
    author: "Jane Smith", 
    status: "draft",
    views: 0,
    date: "2024-01-12",
    category: "Development"
  },
  {
    id: 3,
    title: "Building Scalable APIs",
    author: "Mike Johnson",
    status: "published", 
    views: 890,
    date: "2024-01-08",
    category: "Backend"
  },
  {
    id: 4,
    title: "Modern CSS Techniques",
    author: "Sarah Wilson",
    status: "review",
    views: 0,
    date: "2024-01-15",
    category: "Design"
  },
  {
    id: 5,
    title: "Database Optimization Tips",
    author: "David Brown",
    status: "published",
    views: 567,
    date: "2024-01-05",
    category: "Database"
  }
]

function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return <Badge variant="default">Published</Badge>
    case "draft":
      return <Badge variant="secondary">Draft</Badge>
    case "review":
      return <Badge variant="outline">In Review</Badge>
    default:
      return <Badge variant="secondary">{status}</Badge>
  }
}

export function AdminDataTable() {
  return (
    <div className="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Recent Articles
          </CardTitle>
          <CardDescription>
            Manage and monitor your content performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Views</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {articles.map((article) => (
                  <TableRow key={article.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {article.title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {article.author}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(article.status)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{article.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        {article.views.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(article.date).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Open menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem variant="destructive">
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              Showing 5 of 1,247 articles
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" disabled>
                Previous
              </Button>
              <Button variant="outline" size="sm">
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 