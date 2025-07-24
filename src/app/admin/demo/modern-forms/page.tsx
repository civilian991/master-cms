"use client"

import * as React from "react"
import { useState } from "react"
import { ModernInput, ModernTextarea, ModernSelect } from "@/components/ui/modern-input"
import { ModernFormLayout, ModernFieldGroup, ModernFormGrid } from "@/components/ui/modern-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Phone, MapPin, FileText, Calendar } from "lucide-react"

export default function ModernFormsDemo() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    company: "",
    role: "",
    bio: "",
    country: "",
    notifications: "",
    plan: ""
  })

  const [formState, setFormState] = useState<{
    loading: boolean
    error: string
    success: string
  }>({
    loading: false,
    error: "",
    success: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormState({ loading: true, error: "", success: "" })

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000))

    // Simulate success
    setFormState({ 
      loading: false, 
      error: "", 
      success: "Profile updated successfully!" 
    })

    // Clear success message after 3 seconds
    setTimeout(() => {
      setFormState(prev => ({ ...prev, success: "" }))
    }, 3000)
  }

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const roleOptions = [
    { value: "developer", label: "Developer" },
    { value: "designer", label: "Designer" },
    { value: "manager", label: "Manager" },
    { value: "analyst", label: "Analyst" }
  ]

  const countryOptions = [
    { value: "us", label: "United States" },
    { value: "uk", label: "United Kingdom" },
    { value: "ca", label: "Canada" },
    { value: "au", label: "Australia" }
  ]

  const planOptions = [
    { value: "basic", label: "Basic Plan" },
    { value: "pro", label: "Pro Plan" },
    { value: "enterprise", label: "Enterprise Plan" }
  ]

  return (
    <div className="min-h-screen bg-gray-25 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <h1 className="text-display text-gray-900">Modern Forms Demo</h1>
            <Badge variant="outline" className="bg-brand-50 text-brand-700 border-brand-200">
              Epic 11.4
            </Badge>
          </div>
          <p className="text-body text-gray-600 max-w-2xl mx-auto">
            Showcasing enhanced form components with floating labels, validation states, and modern UX patterns
          </p>
        </div>

        {/* Form Variants Showcase */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Default Variant */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <FileText className="h-4 w-4 text-blue-600" />
                </div>
                Default Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModernInput
                label="Full Name"
                placeholder="Enter your name"
                hint="This will be displayed on your profile"
                leftIcon={User}
              />
              <ModernInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                leftIcon={Mail}
                value="demo@example.com"
                success="Email verified"
              />
              <ModernInput
                label="Password"
                type="password"
                placeholder="Enter password"
                error="Password must be at least 8 characters"
              />
            </CardContent>
          </Card>

          {/* Floating Labels */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                Floating Labels
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModernInput
                variant="floating"
                label="Company Name"
                placeholder="Enter company"
                leftIcon={FileText}
              />
              <ModernInput
                variant="floating"
                label="Phone Number"
                placeholder="Enter phone"
                leftIcon={Phone}
                value="+1 (555) 123-4567"
              />
              <ModernSelect
                variant="floating"
                label="Select Country"
                options={countryOptions}
                value="us"
                onChange={(value) => updateField("country", value)}
              />
            </CardContent>
          </Card>

          {/* Minimal Style */}
          <Card className="border-0 shadow-soft">
            <CardHeader>
              <CardTitle className="text-heading flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-purple-600" />
                </div>
                Minimal Style
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ModernInput
                variant="minimal"
                label="Location"
                placeholder="City, State"
                leftIcon={MapPin}
              />
              <ModernInput
                variant="minimal"
                label="Bio"
                placeholder="Tell us about yourself"
              />
              <ModernTextarea
                variant="floating"
                label="Additional Notes"
                placeholder="Any additional information..."
                resize={false}
              />
            </CardContent>
          </Card>
        </div>

        {/* Complete Form Example */}
        <ModernFormLayout
          title="User Profile Settings"
          description="Update your profile information and preferences"
          onSubmit={handleSubmit}
          loading={formState.loading}
          error={formState.error}
          success={formState.success}
          actions={
            <div className="flex items-center gap-3">
              <Button 
                type="button" 
                variant="outline"
                className="shadow-soft hover:shadow-medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={formState.loading}
                className="bg-gradient-brand shadow-soft hover:shadow-medium"
              >
                {formState.loading ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          }
        >
          <ModernFieldGroup
            title="Personal Information"
            description="Basic information about yourself"
          >
            <ModernFormGrid>
              <ModernInput
                variant="floating"
                label="First Name"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(e) => updateField("firstName", e.target.value)}
                leftIcon={User}
              />
              <ModernInput
                variant="floating"
                label="Last Name"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(e) => updateField("lastName", e.target.value)}
                leftIcon={User}
              />
            </ModernFormGrid>

            <ModernFormGrid>
              <ModernInput
                variant="floating"
                label="Email Address"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={(e) => updateField("email", e.target.value)}
                leftIcon={Mail}
              />
              <ModernInput
                variant="floating"
                label="Phone Number"
                placeholder="Enter phone"
                value={formData.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                leftIcon={Phone}
              />
            </ModernFormGrid>
          </ModernFieldGroup>

          <ModernFieldGroup
            title="Professional Details"
            description="Information about your work and role"
          >
            <ModernFormGrid>
              <ModernInput
                variant="floating"
                label="Company"
                placeholder="Enter company name"
                value={formData.company}
                onChange={(e) => updateField("company", e.target.value)}
              />
              <ModernSelect
                variant="floating"
                label="Role"
                placeholder="Select your role"
                options={roleOptions}
                value={formData.role}
                onChange={(value) => updateField("role", value)}
              />
            </ModernFormGrid>

            <ModernTextarea
              variant="floating"
              label="Bio"
              placeholder="Tell us about yourself and your work..."
              value={formData.bio}
              onChange={(e) => updateField("bio", e.target.value)}
              resize={false}
            />
          </ModernFieldGroup>

          <ModernFieldGroup
            title="Preferences"
            description="Customize your account settings"
          >
            <ModernFormGrid>
              <ModernSelect
                variant="floating"
                label="Country"
                placeholder="Select country"
                options={countryOptions}
                value={formData.country}
                onChange={(value) => updateField("country", value)}
              />
              <ModernSelect
                variant="floating"
                label="Plan"
                placeholder="Select plan"
                options={planOptions}
                value={formData.plan}
                onChange={(value) => updateField("plan", value)}
              />
            </ModernFormGrid>
          </ModernFieldGroup>
        </ModernFormLayout>

        {/* Features Showcase */}
        <Card className="border-0 shadow-soft bg-gradient-subtle">
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <h3 className="text-heading text-gray-900">Enhanced Form Features</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center mx-auto">
                    <User className="h-6 w-6 text-brand-600" />
                  </div>
                  <h4 className="text-caption font-semibold text-gray-900">Floating Labels</h4>
                  <p className="text-caption text-gray-600">Smooth animated labels that enhance UX</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-success-100 rounded-xl flex items-center justify-center mx-auto">
                    <FileText className="h-6 w-6 text-success-600" />
                  </div>
                  <h4 className="text-caption font-semibold text-gray-900">Smart Validation</h4>
                  <p className="text-caption text-gray-600">Real-time validation with clear feedback</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <h4 className="text-caption font-semibold text-gray-900">Modern Design</h4>
                  <p className="text-caption text-gray-600">Professional styling with glassmorphism</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 