import { NextRequest, NextResponse } from 'next/server'
import { siteConfig, SiteConfig } from '../../../config/site'

export async function GET() {
  try {
    const config = siteConfig.getConfig()
    
    return NextResponse.json({
      success: true,
      data: config,
    })
  } catch (error) {
    console.error('Configuration GET error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to retrieve configuration',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const updates = body.config as Partial<SiteConfig>

    if (!updates) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration updates are required',
        },
        { status: 400 }
      )
    }

    // Validate the configuration
    const validation = siteConfig.validateConfig(updates)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Update the configuration
    siteConfig.updateConfig(updates)
    const updatedConfig = siteConfig.getConfig()

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration updated successfully',
    })
  } catch (error) {
    console.error('Configuration POST error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update configuration',
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const newConfig = body.config as SiteConfig

    if (!newConfig) {
      return NextResponse.json(
        {
          success: false,
          error: 'Complete configuration is required',
        },
        { status: 400 }
      )
    }

    // Validate the configuration
    const validation = siteConfig.validateConfig(newConfig)
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Configuration validation failed',
          details: validation.errors,
        },
        { status: 400 }
      )
    }

    // Replace the entire configuration
    siteConfig.updateConfig(newConfig)
    const updatedConfig = siteConfig.getConfig()

    return NextResponse.json({
      success: true,
      data: updatedConfig,
      message: 'Configuration replaced successfully',
    })
  } catch (error) {
    console.error('Configuration PUT error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to replace configuration',
      },
      { status: 500 }
    )
  }
}

export async function DELETE() {
  try {
    // Reset to default configuration
    siteConfig.updateConfig({})
    const defaultConfig = siteConfig.getConfig()

    return NextResponse.json({
      success: true,
      data: defaultConfig,
      message: 'Configuration reset to defaults',
    })
  } catch (error) {
    console.error('Configuration DELETE error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reset configuration',
      },
      { status: 500 }
    )
  }
} 