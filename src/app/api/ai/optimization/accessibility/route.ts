import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ContentOptimizationService } from '@/lib/services/ai/content-optimization';

// Validation schemas
const AccessibilityAuditRequestSchema = z.object({
  url: z.string().url(),
  contentType: z.enum(['article', 'page', 'category']),
  contentId: z.string().uuid().optional(),
  html: z.string().optional(),
  level: z.enum(['A', 'AA', 'AAA']).default('AA'),
  includeWarnings: z.boolean().default(true),
});

const BatchAccessibilityAuditRequestSchema = z.object({
  urls: z.array(z.string().url()),
  contentType: z.enum(['article', 'page', 'category']),
  level: z.enum(['A', 'AA', 'AAA']).default('AA'),
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'audit':
        return await handleAccessibilityAudit(body);
      case 'batch-audit':
        return await handleBatchAccessibilityAudit(body);
      case 'fix-issues':
        return await handleFixAccessibilityIssues(body);
      case 'generate-report':
        return await handleGenerateAccessibilityReport(body);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Accessibility audit error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleAccessibilityAudit(body: any) {
  const validatedData = AccessibilityAuditRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.auditAccessibility({
      url: validatedData.url,
      contentType: validatedData.contentType,
      contentId: validatedData.contentId,
      html: validatedData.html,
      level: validatedData.level,
      includeWarnings: validatedData.includeWarnings,
    });

    // Save accessibility audit
    const accessibilityAudit = await prisma.accessibilityAudit.create({
      data: {
        url: validatedData.url,
        contentType: validatedData.contentType,
        contentId: validatedData.contentId,
        level: validatedData.level,
        violations: result.violations,
        warnings: result.warnings,
        passes: result.passes,
        score: result.score,
        recommendations: result.recommendations,
        status: 'completed',
        auditedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      audit: accessibilityAudit,
      result,
    });
  } catch (error) {
    console.error('Accessibility audit failed:', error);
    return NextResponse.json(
      { error: 'Accessibility audit failed' },
      { status: 500 }
    );
  }
}

async function handleBatchAccessibilityAudit(body: any) {
  const validatedData = BatchAccessibilityAuditRequestSchema.parse(body);

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const results = await optimizationService.batchAuditAccessibility({
      urls: validatedData.urls,
      contentType: validatedData.contentType,
      level: validatedData.level,
    });

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Batch accessibility audit failed:', error);
    return NextResponse.json(
      { error: 'Batch accessibility audit failed' },
      { status: 500 }
    );
  }
}

async function handleFixAccessibilityIssues(body: any) {
  const { url, html, issues } = body;

  if (!url || !html || !issues) {
    return NextResponse.json(
      { error: 'URL, HTML, and issues are required' },
      { status: 400 }
    );
  }

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const result = await optimizationService.fixAccessibilityIssues({
      url,
      html,
      issues,
    });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Fixing accessibility issues failed:', error);
    return NextResponse.json(
      { error: 'Fixing accessibility issues failed' },
      { status: 500 }
    );
  }
}

async function handleGenerateAccessibilityReport(body: any) {
  const { contentType, timeRange, level } = body;

  try {
    const optimizationService = ContentOptimizationService.getInstance();
    
    const report = await optimizationService.generateAccessibilityReport({
      contentType,
      timeRange: timeRange || '30d',
      level: level || 'AA',
    });

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Generating accessibility report failed:', error);
    return NextResponse.json(
      { error: 'Generating accessibility report failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const contentType = searchParams.get('contentType');
    const level = searchParams.get('level');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = {};
    if (url) where.url = url;
    if (contentType) where.contentType = contentType;
    if (level) where.level = level;
    if (status) where.status = status;

    const [audits, total] = await Promise.all([
      prisma.accessibilityAudit.findMany({
        where,
        orderBy: { auditedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.accessibilityAudit.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      audits,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch accessibility audits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
      { status: 500 }
    );
  }
} 