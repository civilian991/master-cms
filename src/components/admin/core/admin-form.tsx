"use client"

import * as React from "react"
import { useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import {
  SaveIcon,
  LoaderIcon,
  XIcon,
  EyeIcon,
  EyeOffIcon,
  CalendarIcon,
  UploadIcon,
  PlusIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

// Field types for dynamic form generation
export type AdminFormFieldType = 
  | 'text' 
  | 'email' 
  | 'password' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'multiselect'
  | 'checkbox' 
  | 'switch' 
  | 'date' 
  | 'file' 
  | 'tags'
  | 'json'

export interface AdminFormFieldOption {
  label: string
  value: string | number
  disabled?: boolean
}

export interface AdminFormField {
  name: string
  label: string
  type: AdminFormFieldType
  placeholder?: string
  description?: string
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  options?: AdminFormFieldOption[] // For select/multiselect
  validation?: z.ZodSchema
  defaultValue?: any
  rows?: number // For textarea
  accept?: string // For file input
  multiple?: boolean // For file/multiselect
  grid?: {
    cols?: 1 | 2 | 3 | 4 | 6 | 12
    colSpan?: 1 | 2 | 3 | 4 | 6 | 12
  }
}

export interface AdminFormSection {
  title: string
  description?: string
  fields: AdminFormField[]
  collapsible?: boolean
  defaultOpen?: boolean
}

export interface AdminFormProps {
  title: string
  description?: string
  sections: AdminFormSection[]
  schema?: z.ZodSchema
  defaultValues?: Record<string, any>
  loading?: boolean
  onSubmit: (data: any) => void | Promise<void>
  onCancel?: () => void
  onReset?: () => void
  submitLabel?: string
  cancelLabel?: string
  resetLabel?: string
  className?: string
}

// Helper function to render form fields
const renderFormField = (field: AdminFormField, form: any) => {
  const [showPassword, setShowPassword] = useState(false)
  const [tags, setTags] = useState<string[]>(form.getValues(field.name) || [])

  switch (field.type) {
    case 'text':
    case 'email':
    case 'number':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <Input
                  {...formField}
                  type={field.type}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                />
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'password':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    {...formField}
                    type={showPassword ? 'text' : 'password'}
                    placeholder={field.placeholder}
                    disabled={field.disabled}
                    readOnly={field.readOnly}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOffIcon className="h-4 w-4" />
                    ) : (
                      <EyeIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'textarea':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <Textarea
                  {...formField}
                  placeholder={field.placeholder}
                  disabled={field.disabled}
                  readOnly={field.readOnly}
                  rows={field.rows || 4}
                />
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'select':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <Select 
                onValueChange={formField.onChange} 
                defaultValue={formField.value}
                disabled={field.disabled}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={field.placeholder} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={String(option.value)}
                      disabled={option.disabled}
                    >
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'checkbox':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                  disabled={field.disabled}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'switch':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">{field.label}</FormLabel>
                {field.description && (
                  <FormDescription>{field.description}</FormDescription>
                )}
              </div>
              <FormControl>
                <Switch
                  checked={formField.value}
                  onCheckedChange={formField.onChange}
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'tags':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0"
                          onClick={() => {
                            const newTags = tags.filter((_, i) => i !== index)
                            setTags(newTags)
                            formField.onChange(newTags)
                          }}
                        >
                          <XIcon className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          const value = e.currentTarget.value.trim()
                          if (value && !tags.includes(value)) {
                            const newTags = [...tags, value]
                            setTags(newTags)
                            formField.onChange(newTags)
                            e.currentTarget.value = ''
                          }
                        }
                      }}
                      disabled={field.disabled}
                    />
                  </div>
                </div>
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    case 'file':
      return (
        <FormField
          control={form.control}
          name={field.name}
          render={({ field: formField }) => (
            <FormItem>
              <FormLabel>{field.label}</FormLabel>
              <FormControl>
                <div className="grid w-full items-center gap-1.5">
                  <Input
                    type="file"
                    accept={field.accept}
                    multiple={field.multiple}
                    disabled={field.disabled}
                    onChange={(e) => {
                      const files = e.target.files
                      if (files) {
                        formField.onChange(field.multiple ? Array.from(files) : files[0])
                      }
                    }}
                  />
                </div>
              </FormControl>
              {field.description && (
                <FormDescription>{field.description}</FormDescription>
              )}
              <FormMessage />
            </FormItem>
          )}
        />
      )

    default:
      return null
  }
}

export function AdminForm({
  title,
  description,
  sections,
  schema,
  defaultValues = {},
  loading = false,
  onSubmit,
  onCancel,
  onReset,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  resetLabel = "Reset",
  className,
}: AdminFormProps) {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
  })

  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('Form submission error:', error)
    }
  }

  const handleReset = () => {
    form.reset()
    onReset?.()
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {sections.map((section, sectionIndex) => (
              <div key={sectionIndex} className="space-y-4">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-medium">{section.title}</h3>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {section.fields.map((field, fieldIndex) => (
                    <div
                      key={fieldIndex}
                      className={cn(
                        field.grid?.colSpan && `md:col-span-${field.grid.colSpan}`,
                        field.grid?.cols === 1 && "md:col-span-2"
                      )}
                    >
                      {renderFormField(field, form)}
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                {onReset && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleReset}
                    disabled={loading}
                  >
                    {resetLabel}
                  </Button>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                {onCancel && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                    disabled={loading}
                  >
                    {cancelLabel}
                  </Button>
                )}
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <LoaderIcon className="h-4 w-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      {submitLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
} 