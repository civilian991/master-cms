import { 
  NotificationTemplate, 
  NotificationPayload, 
  defaultNotificationTemplates 
} from './push-notifications';

interface TemplateContext {
  [key: string]: string | number | boolean | Date;
}

interface NotificationPersonalization {
  userId: string;
  userPreferences?: {
    language?: string;
    timezone?: string;
    firstName?: string;
    lastName?: string;
  };
  contentContext?: TemplateContext;
  deviceInfo?: {
    platform?: string;
    userAgent?: string;
  };
}

interface RenderedNotificationContent {
  title: string;
  body: string;
  icon?: string;
  data?: Record<string, any>;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

class NotificationTemplateService {
  private templates: Map<string, NotificationTemplate> = new Map();

  constructor() {
    this.loadDefaultTemplates();
  }

  /**
   * Load default notification templates
   */
  private loadDefaultTemplates(): void {
    defaultNotificationTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  /**
   * Register a new notification template
   */
  public registerTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template);
  }

  /**
   * Get all available templates
   */
  public getAllTemplates(): NotificationTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by category
   */
  public getTemplatesByCategory(category: NotificationTemplate['category']): NotificationTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  /**
   * Get a specific template by ID
   */
  public getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId);
  }

  /**
   * Remove a template
   */
  public removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  /**
   * Render a notification from template with personalization
   */
  public renderNotification(
    templateId: string,
    context: TemplateContext,
    personalization?: NotificationPersonalization
  ): RenderedNotificationContent {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template with ID '${templateId}' not found`);
    }

    const enrichedContext = this.enrichContext(context, personalization);
    
    return {
      title: this.renderTemplate(template.title, enrichedContext),
      body: this.renderTemplate(template.body, enrichedContext),
      icon: template.icon,
      data: {
        templateId,
        userId: personalization?.userId,
        category: template.category,
        timestamp: new Date().toISOString(),
        ...template.defaultData,
        ...this.processDataContext(template.defaultData || {}, enrichedContext),
      },
      actions: this.renderActions(template, enrichedContext),
    };
  }

  /**
   * Create a complete notification payload from template
   */
  public createNotificationPayload(
    templateId: string,
    context: TemplateContext,
    personalization?: NotificationPersonalization,
    overrides?: Partial<NotificationPayload>
  ): NotificationPayload {
    const rendered = this.renderNotification(templateId, context, personalization);
    
    return {
      title: rendered.title,
      body: rendered.body,
      icon: rendered.icon,
      data: rendered.data,
      actions: rendered.actions,
      tag: `${templateId}-${personalization?.userId || 'anonymous'}`,
      requireInteraction: false,
      silent: false,
      ...overrides,
    };
  }

  /**
   * Validate template variables against context
   */
  public validateTemplateContext(templateId: string, context: TemplateContext): {
    isValid: boolean;
    missingVariables: string[];
    extraVariables: string[];
  } {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      return {
        isValid: false,
        missingVariables: [],
        extraVariables: [],
      };
    }

    const requiredVariables = template.variables || [];
    const providedVariables = Object.keys(context);
    
    const missingVariables = requiredVariables.filter(
      variable => !(variable in context)
    );
    
    const extraVariables = providedVariables.filter(
      variable => !requiredVariables.includes(variable)
    );

    return {
      isValid: missingVariables.length === 0,
      missingVariables,
      extraVariables,
    };
  }

  /**
   * Get localized templates based on user preferences
   */
  public getLocalizedTemplate(
    templateId: string,
    language: string = 'en'
  ): NotificationTemplate | undefined {
    // First try to get language-specific template
    const localizedTemplate = this.getTemplate(`${templateId}-${language}`);
    
    if (localizedTemplate) {
      return localizedTemplate;
    }
    
    // Fall back to default template
    return this.getTemplate(templateId);
  }

  /**
   * Preview notification rendering without sending
   */
  public previewNotification(
    templateId: string,
    context: TemplateContext,
    personalization?: NotificationPersonalization
  ): {
    rendered: RenderedNotificationContent;
    validation: ReturnType<typeof this.validateTemplateContext>;
    preview: string;
  } {
    const validation = this.validateTemplateContext(templateId, context);
    const rendered = this.renderNotification(templateId, context, personalization);
    
         const preview = `
📱 ${rendered.title}
${rendered.body}
${rendered.actions?.map((action: { action: string; title: string; icon?: string }) => `[${action.title}]`).join(' ') || ''}
    `.trim();

    return {
      rendered,
      validation,
      preview,
    };
  }

  /**
   * Enrich context with personalization data
   */
  private enrichContext(
    context: TemplateContext,
    personalization?: NotificationPersonalization
  ): TemplateContext {
    const enriched = { ...context };

    if (personalization?.userPreferences) {
      const { userPreferences } = personalization;
      
      if (userPreferences.firstName) {
        enriched.firstName = userPreferences.firstName;
      }
      
      if (userPreferences.lastName) {
        enriched.lastName = userPreferences.lastName;
      }
      
      if (userPreferences.firstName && userPreferences.lastName) {
        enriched.fullName = `${userPreferences.firstName} ${userPreferences.lastName}`;
      }

      if (userPreferences.timezone) {
        enriched.userTimezone = userPreferences.timezone;
      }
    }

    // Add system context
    enriched.currentTime = new Date().toISOString();
    enriched.currentDate = new Date().toLocaleDateString();
    
    if (personalization?.deviceInfo?.platform) {
      enriched.platform = personalization.deviceInfo.platform;
    }

    return enriched;
  }

  /**
   * Render template string with context variables
   */
  private renderTemplate(template: string, context: TemplateContext): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
      const value = context[variable];
      
      if (value === undefined || value === null) {
        console.warn(`Template variable '${variable}' not found in context`);
        return match; // Keep the placeholder if variable is missing
      }
      
      return String(value);
    });
  }

  /**
   * Process data context for template default data
   */
  private processDataContext(
    defaultData: Record<string, any>,
    context: TemplateContext
  ): Record<string, any> {
    const processedData: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(defaultData)) {
      if (typeof value === 'string') {
        processedData[key] = this.renderTemplate(value, context);
      } else {
        processedData[key] = value;
      }
    }
    
    return processedData;
  }

  /**
   * Render notification actions based on template and context
   */
  private renderActions(
    template: NotificationTemplate,
    context: TemplateContext
  ): Array<{ action: string; title: string; icon?: string }> | undefined {
    // Define common actions based on template category
    const categoryActions: Record<string, Array<{ action: string; title: string; icon?: string }>> = {
      article: [
        { action: 'read', title: 'Read Now', icon: '/icons/read.png' },
        { action: 'bookmark', title: 'Bookmark', icon: '/icons/bookmark.png' },
      ],
      comment: [
        { action: 'reply', title: 'Reply', icon: '/icons/reply.png' },
        { action: 'view', title: 'View', icon: '/icons/view.png' },
      ],
      system: [
        { action: 'acknowledge', title: 'OK', icon: '/icons/check.png' },
      ],
      marketing: [
        { action: 'view_offer', title: 'View Offer', icon: '/icons/offer.png' },
        { action: 'dismiss', title: 'Not Interested', icon: '/icons/close.png' },
      ],
      engagement: [
        { action: 'explore', title: 'Explore', icon: '/icons/explore.png' },
        { action: 'later', title: 'Remind Later', icon: '/icons/clock.png' },
      ],
    };

    return categoryActions[template.category];
  }

  /**
   * Create A/B test variants of a template
   */
  public createVariant(
    baseTemplateId: string,
    variantId: string,
    modifications: Partial<Pick<NotificationTemplate, 'title' | 'body' | 'icon'>>
  ): NotificationTemplate | null {
    const baseTemplate = this.getTemplate(baseTemplateId);
    
    if (!baseTemplate) {
      return null;
    }

    const variant: NotificationTemplate = {
      ...baseTemplate,
      id: variantId,
      name: `${baseTemplate.name} (Variant)`,
      ...modifications,
    };

    this.registerTemplate(variant);
    return variant;
  }

  /**
   * Get template usage statistics (would connect to analytics)
   */
  public async getTemplateStats(templateId: string): Promise<{
    sentCount: number;
    clickRate: number;
    dismissalRate: number;
    lastUsed: Date | null;
  }> {
    // This would connect to your analytics service
    // For now, returning mock data
    return {
      sentCount: 0,
      clickRate: 0,
      dismissalRate: 0,
      lastUsed: null,
    };
  }

  /**
   * Test template rendering with sample data
   */
  public testTemplate(templateId: string): {
    isValid: boolean;
    errors: string[];
    preview: string | null;
  } {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      return {
        isValid: false,
        errors: [`Template '${templateId}' not found`],
        preview: null,
      };
    }

    const errors: string[] = [];

    // Create sample context with all required variables
    const sampleContext: TemplateContext = {};
    
    if (template.variables) {
      template.variables.forEach(variable => {
        sampleContext[variable] = `[${variable}]`;
      });
    }

    try {
      const preview = this.previewNotification(templateId, sampleContext);
      
             return {
         isValid: preview.validation.isValid,
         errors: preview.validation.missingVariables.map((v: string) => `Missing variable: ${v}`),
         preview: preview.preview,
       };
    } catch (error) {
      errors.push(`Rendering error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      return {
        isValid: false,
        errors,
        preview: null,
      };
    }
  }
}

// Predefined localized templates
export const localizedTemplates: NotificationTemplate[] = [
  // Spanish variants
  {
    id: 'new-article-es',
    name: 'Nuevo Artículo Publicado',
    title: 'Nuevo Artículo: {{title}}',
    body: 'Un nuevo artículo "{{title}}" ha sido publicado por {{author}}',
    icon: '/icons/article-icon.png',
    category: 'article',
    variables: ['title', 'author'],
    defaultData: {
      url: '/articles/{{slug}}',
    },
  },
  // French variants
  {
    id: 'new-article-fr',
    name: 'Nouvel Article Publié',
    title: 'Nouvel Article: {{title}}',
    body: 'Un nouvel article "{{title}}" a été publié par {{author}}',
    icon: '/icons/article-icon.png',
    category: 'article',
    variables: ['title', 'author'],
    defaultData: {
      url: '/articles/{{slug}}',
    },
  },
];

// Export singleton instance
export const notificationTemplateService = new NotificationTemplateService();

// Register localized templates
localizedTemplates.forEach(template => {
  notificationTemplateService.registerTemplate(template);
});

export default notificationTemplateService; 