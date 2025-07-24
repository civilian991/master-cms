import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/nextauth';
import { emailMarketingService } from '@/lib/services/email-marketing';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    if (campaignId) {
      // Get analytics for specific campaign
      const analytics = await emailMarketingService.getCampaignAnalytics(campaignId);
      return NextResponse.json({ analytics });
    } else {
      // Get overall analytics for site
      const campaigns = await emailMarketingService.getCampaigns(siteId);
      
      // Calculate overall metrics
      const overallAnalytics = {
        totalCampaigns: campaigns.length,
        totalSent: campaigns.reduce((sum: number, campaign: any) => sum + campaign.recipientCount, 0),
        totalOpened: campaigns.reduce((sum: number, campaign: any) => sum + campaign.openCount, 0),
        totalClicked: campaigns.reduce((sum: number, campaign: any) => sum + campaign.clickCount, 0),
        totalBounced: campaigns.reduce((sum: number, campaign: any) => sum + campaign.bounceCount, 0),
        averageOpenRate: 0,
        averageClickRate: 0,
      };

      // Calculate rates
      if (overallAnalytics.totalSent > 0) {
        overallAnalytics.averageOpenRate = (overallAnalytics.totalOpened / overallAnalytics.totalSent) * 100;
        overallAnalytics.averageClickRate = (overallAnalytics.totalClicked / overallAnalytics.totalSent) * 100;
      }

      return NextResponse.json({ analytics: overallAnalytics });
    }
  } catch (error) {
    console.error('Failed to get email analytics:', error);
    return NextResponse.json(
      { error: 'Failed to get email analytics' },
      { status: 500 }
    );
  }
} 