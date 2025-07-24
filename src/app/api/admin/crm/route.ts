import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { crmService } from '@/lib/services/crm';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const siteId = searchParams.get('siteId');

    if (!siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        siteId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (resource) {
      case 'leads':
        const leadFilters = {
          status: searchParams.get('status') || undefined,
          assignedTo: searchParams.get('assignedTo') || undefined,
          source: searchParams.get('source') || undefined,
          score: searchParams.get('scoreMin') || searchParams.get('scoreMax') ? {
            min: searchParams.get('scoreMin') ? parseInt(searchParams.get('scoreMin')!) : undefined,
            max: searchParams.get('scoreMax') ? parseInt(searchParams.get('scoreMax')!) : undefined,
          } : undefined,
          dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
            start: new Date(searchParams.get('startDate')!),
            end: new Date(searchParams.get('endDate')!),
          } : undefined,
        };
        const leads = await crmService.getLeads(siteId, leadFilters);
        return NextResponse.json(leads);

      case 'contacts':
        const contactFilters = {
          status: searchParams.get('status') || undefined,
          assignedTo: searchParams.get('assignedTo') || undefined,
          engagementLevel: searchParams.get('engagementLevel') || undefined,
          dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
            start: new Date(searchParams.get('startDate')!),
            end: new Date(searchParams.get('endDate')!),
          } : undefined,
        };
        const contacts = await crmService.getContacts(siteId, contactFilters);
        return NextResponse.json(contacts);

      case 'deals':
        const dealFilters = {
          stage: searchParams.get('stage') || undefined,
          assignedTo: searchParams.get('assignedTo') || undefined,
          isWon: searchParams.get('isWon') ? searchParams.get('isWon') === 'true' : undefined,
          isLost: searchParams.get('isLost') ? searchParams.get('isLost') === 'true' : undefined,
          dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
            start: new Date(searchParams.get('startDate')!),
            end: new Date(searchParams.get('endDate')!),
          } : undefined,
        };
        const deals = await crmService.getDeals(siteId, dealFilters);
        return NextResponse.json(deals);

      case 'interactions':
        const interactionFilters = {
          type: searchParams.get('type') || undefined,
          leadId: searchParams.get('leadId') || undefined,
          contactId: searchParams.get('contactId') || undefined,
          dealId: searchParams.get('dealId') || undefined,
          initiatedBy: searchParams.get('initiatedBy') || undefined,
          dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
            start: new Date(searchParams.get('startDate')!),
            end: new Date(searchParams.get('endDate')!),
          } : undefined,
        };
        const interactions = await crmService.getInteractions(siteId, interactionFilters);
        return NextResponse.json(interactions);

      case 'campaigns':
        const campaignFilters = {
          type: searchParams.get('type') || undefined,
          status: searchParams.get('status') || undefined,
          createdBy: searchParams.get('createdBy') || undefined,
          dateRange: searchParams.get('startDate') && searchParams.get('endDate') ? {
            start: new Date(searchParams.get('startDate')!),
            end: new Date(searchParams.get('endDate')!),
          } : undefined,
        };
        const campaigns = await crmService.getCampaigns(siteId, campaignFilters);
        return NextResponse.json(campaigns);

      case 'tasks':
        const taskFilters = {
          type: searchParams.get('type') || undefined,
          priority: searchParams.get('priority') || undefined,
          status: searchParams.get('status') || undefined,
          assignedTo: searchParams.get('assignedTo') || undefined,
          dueDate: searchParams.get('dueDateStart') && searchParams.get('dueDateEnd') ? {
            start: new Date(searchParams.get('dueDateStart')!),
            end: new Date(searchParams.get('dueDateEnd')!),
          } : undefined,
        };
        const tasks = await crmService.getTasks(siteId, taskFilters);
        return NextResponse.json(tasks);

      case 'workflows':
        const workflowFilters = {
          type: searchParams.get('type') || undefined,
          status: searchParams.get('status') || undefined,
          createdBy: searchParams.get('createdBy') || undefined,
          isActive: searchParams.get('isActive') ? searchParams.get('isActive') === 'true' : undefined,
        };
        const workflows = await crmService.getWorkflows(siteId, workflowFilters);
        return NextResponse.json(workflows);

      case 'analytics':
        const analyticsDateRange = searchParams.get('startDate') && searchParams.get('endDate') ? {
          start: new Date(searchParams.get('startDate')!),
          end: new Date(searchParams.get('endDate')!),
        } : undefined;
        const analytics = await crmService.getCRMAnalytics(siteId, analyticsDateRange);
        return NextResponse.json(analytics);

      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const body = await request.json();

    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        siteId: body.siteId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (resource) {
      case 'leads':
        const lead = await crmService.createLead(body);
        return NextResponse.json(lead, { status: 201 });

      case 'contacts':
        const contact = await crmService.createContact(body);
        return NextResponse.json(contact, { status: 201 });

      case 'deals':
        const deal = await crmService.createDeal(body);
        return NextResponse.json(deal, { status: 201 });

      case 'interactions':
        const interaction = await crmService.createInteraction(body);
        return NextResponse.json(interaction, { status: 201 });

      case 'campaigns':
        const campaign = await crmService.createCampaign(body);
        return NextResponse.json(campaign, { status: 201 });

      case 'tasks':
        const task = await crmService.createTask(body);
        return NextResponse.json(task, { status: 201 });

      case 'workflows':
        const workflow = await crmService.createWorkflow(body);
        return NextResponse.json(workflow, { status: 201 });

      case 'convert-lead':
        const { leadId, contactData } = body;
        const convertedContact = await crmService.convertLeadToContact(leadId, body.siteId, contactData);
        return NextResponse.json(convertedContact, { status: 201 });

      case 'add-leads-to-campaign':
        const { campaignId, leadIds } = body;
        const campaignLeads = await crmService.addLeadsToCampaign(campaignId, body.siteId, leadIds);
        return NextResponse.json(campaignLeads, { status: 201 });

      case 'add-contacts-to-campaign':
        const { campaignId: campId, contactIds } = body;
        const campaignContacts = await crmService.addContactsToCampaign(campId, body.siteId, contactIds);
        return NextResponse.json(campaignContacts, { status: 201 });

      case 'execute-workflow':
        const { workflowId, input } = body;
        const result = await crmService.executeWorkflow(workflowId, body.siteId, input);
        return NextResponse.json(result, { status: 200 });

      case 'import-leads':
        const { leads } = body;
        const importResult = await crmService.importLeads(body.siteId, leads);
        return NextResponse.json(importResult, { status: 201 });

      case 'import-contacts':
        const { contacts } = body;
        const importContactsResult = await crmService.importContacts(body.siteId, contacts);
        return NextResponse.json(importContactsResult, { status: 201 });

      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const id = searchParams.get('id');
    const body = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Resource ID is required' }, { status: 400 });
    }

    if (!body.siteId) {
      return NextResponse.json({ error: 'Site ID is required' }, { status: 400 });
    }

    // Check if user has access to the site
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        siteId: body.siteId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (resource) {
      case 'leads':
        const lead = await crmService.updateLead(id, body.siteId, body);
        return NextResponse.json(lead);

      case 'contacts':
        const contact = await crmService.updateContact(id, body.siteId, body);
        return NextResponse.json(contact);

      case 'deals':
        const deal = await crmService.updateDeal(id, body.siteId, body);
        return NextResponse.json(deal);

      case 'interactions':
        const interaction = await crmService.updateInteraction(id, body.siteId, body);
        return NextResponse.json(interaction);

      case 'campaigns':
        const campaign = await crmService.updateCampaign(id, body.siteId, body);
        return NextResponse.json(campaign);

      case 'tasks':
        const task = await crmService.updateTask(id, body.siteId, body);
        return NextResponse.json(task);

      case 'workflows':
        const workflow = await crmService.updateWorkflow(id, body.siteId, body);
        return NextResponse.json(workflow);

      case 'close-deal':
        const { isWon, reason } = body;
        const closedDeal = await crmService.closeDeal(id, body.siteId, isWon, reason);
        return NextResponse.json(closedDeal);

      case 'complete-task':
        const completedTask = await crmService.completeTask(id, body.siteId);
        return NextResponse.json(completedTask);

      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const resource = searchParams.get('resource');
    const id = searchParams.get('id');
    const siteId = searchParams.get('siteId');

    if (!id || !siteId) {
      return NextResponse.json({ error: 'Resource ID and Site ID are required' }, { status: 400 });
    }

    // Check if user has access to the site
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        siteId,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    switch (resource) {
      case 'leads':
        await crmService.deleteLead(id, siteId);
        return NextResponse.json({ success: true });

      case 'contacts':
        await crmService.deleteContact(id, siteId);
        return NextResponse.json({ success: true });

      case 'deals':
        await crmService.deleteDeal(id, siteId);
        return NextResponse.json({ success: true });

      case 'interactions':
        await crmService.deleteInteraction(id, siteId);
        return NextResponse.json({ success: true });

      case 'campaigns':
        await crmService.deleteCampaign(id, siteId);
        return NextResponse.json({ success: true });

      case 'tasks':
        await crmService.deleteTask(id, siteId);
        return NextResponse.json({ success: true });

      case 'workflows':
        await crmService.deleteWorkflow(id, siteId);
        return NextResponse.json({ success: true });

      default:
        return NextResponse.json({ error: 'Invalid resource' }, { status: 400 });
    }
  } catch (error) {
    console.error('CRM API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 