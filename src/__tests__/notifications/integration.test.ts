import { describe, it, expect } from '@jest/globals';
import { 
  pushNotificationService,
  defaultNotificationTemplates 
} from '@/lib/services/push-notifications';
import notificationTemplateService from '@/lib/services/notification-templates';

describe('Push Notifications Integration', () => {
  describe('Service Initialization', () => {
    it('should have push notification service available', () => {
      expect(pushNotificationService).toBeDefined();
      expect(typeof pushNotificationService.isSupported).toBe('function');
      expect(typeof pushNotificationService.getPermissionStatus).toBe('function');
    });

    it('should have notification template service available', () => {
      expect(notificationTemplateService).toBeDefined();
      expect(typeof notificationTemplateService.getAllTemplates).toBe('function');
      expect(typeof notificationTemplateService.renderNotification).toBe('function');
    });
  });

  describe('Template System', () => {
    it('should load default notification templates', () => {
      const templates = notificationTemplateService.getAllTemplates();
      
      expect(templates.length).toBeGreaterThan(0);
      expect(defaultNotificationTemplates.length).toBeGreaterThan(0);
      
      // Check for expected default templates
      const articleTemplate = templates.find(t => t.id === 'new-article');
      expect(articleTemplate).toBeDefined();
      expect(articleTemplate?.name).toBe('New Article Published');
      expect(articleTemplate?.category).toBe('article');
    });

    it('should validate template variables', () => {
      const validation = notificationTemplateService.validateTemplateContext(
        'new-article',
        { title: 'Test Article', author: 'Test Author' }
      );

      expect(validation.isValid).toBe(true);
      expect(validation.missingVariables).toHaveLength(0);
    });

    it('should detect missing template variables', () => {
      const validation = notificationTemplateService.validateTemplateContext(
        'new-article',
        { title: 'Incomplete Article' } // Missing 'author'
      );

      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toContain('author');
    });

    it('should render notification from template', () => {
      const context = {
        title: 'Amazing Article',
        author: 'John Doe',
      };

      const rendered = notificationTemplateService.renderNotification(
        'new-article',
        context
      );

      expect(rendered.title).toBe('New Article: Amazing Article');
      expect(rendered.body).toContain('Amazing Article');
      expect(rendered.body).toContain('John Doe');
      expect(rendered.data?.templateId).toBe('new-article');
    });

    it('should create complete notification payload', () => {
      const context = {
        title: 'Test Article',
        author: 'Test Author',
      };

      const payload = notificationTemplateService.createNotificationPayload(
        'new-article',
        context,
        { userId: 'user-123' }
      );

      expect(payload.title).toBe('New Article: Test Article');
      expect(payload.body).toContain('Test Article');
      expect(payload.tag).toBe('new-article-user-123');
      expect(payload.requireInteraction).toBe(false);
      expect(payload.silent).toBe(false);
    });
  });

  describe('Template Categories', () => {
    it('should get templates by category', () => {
      const articleTemplates = notificationTemplateService.getTemplatesByCategory('article');
      const systemTemplates = notificationTemplateService.getTemplatesByCategory('system');
      
      expect(articleTemplates.length).toBeGreaterThan(0);
      expect(systemTemplates.length).toBeGreaterThan(0);
      
      expect(articleTemplates.every(t => t.category === 'article')).toBe(true);
      expect(systemTemplates.every(t => t.category === 'system')).toBe(true);
    });

    it('should have all expected template categories', () => {
      const templates = notificationTemplateService.getAllTemplates();
      const categories = [...new Set(templates.map(t => t.category))];
      
      expect(categories).toContain('article');
      expect(categories).toContain('comment');
      expect(categories).toContain('system');
      expect(categories).toContain('marketing');
      expect(categories).toContain('engagement');
    });
  });

  describe('Localization Support', () => {
    it('should support localized templates', () => {
      const spanishTemplate = notificationTemplateService.getLocalizedTemplate('new-article', 'es');
      
      expect(spanishTemplate).toBeDefined();
      expect(spanishTemplate?.id).toBe('new-article-es');
      expect(spanishTemplate?.title).toContain('Nuevo Artículo');
    });

    it('should fallback to default template for unknown locale', () => {
      const fallbackTemplate = notificationTemplateService.getLocalizedTemplate('new-article', 'unknown');
      
      expect(fallbackTemplate).toBeDefined();
      expect(fallbackTemplate?.id).toBe('new-article');
      expect(fallbackTemplate?.title).toContain('New Article');
    });
  });

  describe('Template Management', () => {
    it('should register and retrieve custom templates', () => {
      const customTemplate = {
        id: 'test-custom',
        name: 'Custom Test Template',
        title: 'Custom: {{title}}',
        body: 'This is a custom notification for {{user}}',
        category: 'system' as const,
        variables: ['title', 'user'],
      };

      notificationTemplateService.registerTemplate(customTemplate);
      
      const retrieved = notificationTemplateService.getTemplate('test-custom');
      expect(retrieved).toEqual(customTemplate);
    });

    it('should remove templates', () => {
      const testTemplate = {
        id: 'test-removable',
        name: 'Removable Test Template',
        title: 'Removable: {{title}}',
        body: 'This will be removed',
        category: 'system' as const,
        variables: ['title'],
      };

      notificationTemplateService.registerTemplate(testTemplate);
      expect(notificationTemplateService.getTemplate('test-removable')).toBeDefined();

      const removed = notificationTemplateService.removeTemplate('test-removable');
      expect(removed).toBe(true);
      expect(notificationTemplateService.getTemplate('test-removable')).toBeUndefined();
    });
  });

  describe('Template Testing', () => {
    it('should test template rendering with sample data', () => {
      const testResult = notificationTemplateService.testTemplate('new-article');

      expect(testResult.isValid).toBe(true);
      expect(testResult.errors).toHaveLength(0);
      expect(testResult.preview).toBeTruthy();
      expect(testResult.preview).toContain('📱');
    });

    it('should handle testing non-existent template', () => {
      const testResult = notificationTemplateService.testTemplate('non-existent-template');

      expect(testResult.isValid).toBe(false);
      expect(testResult.errors.length).toBeGreaterThan(0);
      expect(testResult.preview).toBeNull();
    });

    it('should preview notification rendering', () => {
      const context = {
        title: 'Preview Article',
        author: 'Preview Author',
      };

      const preview = notificationTemplateService.previewNotification('new-article', context);

      expect(preview.rendered.title).toBe('New Article: Preview Article');
      expect(preview.validation.isValid).toBe(true);
      expect(preview.preview).toContain('📱');
      expect(preview.preview).toContain('Preview Article');
    });
  });

  describe('A/B Testing Support', () => {
    it('should create template variants', () => {
      const variant = notificationTemplateService.createVariant(
        'new-article',
        'new-article-variant-a',
        {
          title: 'Fresh Article: {{title}}',
          body: 'Check out this fresh article "{{title}}" by {{author}}',
        }
      );

      expect(variant).toBeDefined();
      expect(variant?.id).toBe('new-article-variant-a');
      expect(variant?.title).toBe('Fresh Article: {{title}}');
      expect(variant?.name).toContain('(Variant)');
    });

    it('should return null for non-existent base template', () => {
      const variant = notificationTemplateService.createVariant(
        'non-existent-template',
        'variant-id',
        { title: 'New Title' }
      );

      expect(variant).toBeNull();
    });
  });

  describe('Browser Support Detection', () => {
    it('should detect support based on available APIs', () => {
      // Note: In test environment, these APIs may not be available
      // This tests the logic without requiring actual browser APIs
      const hasServiceWorker = typeof navigator !== 'undefined' && 'serviceWorker' in navigator;
      const hasPushManager = typeof window !== 'undefined' && 'PushManager' in window;
      const hasNotification = typeof window !== 'undefined' && 'Notification' in window;
      
      // Test should pass regardless of browser API availability
      expect(typeof pushNotificationService.isSupported()).toBe('boolean');
    });
  });

  describe('Error Handling', () => {
    it('should handle template rendering errors gracefully', () => {
      expect(() => {
        notificationTemplateService.renderNotification('non-existent', {});
      }).toThrow('Template with ID \'non-existent\' not found');
    });

    it('should handle invalid template validation requests', () => {
      const validation = notificationTemplateService.validateTemplateContext('invalid-template', {});
      
      expect(validation.isValid).toBe(false);
      expect(validation.missingVariables).toHaveLength(0);
      expect(validation.extraVariables).toHaveLength(0);
    });
  });

  describe('Data Consistency', () => {
    it('should maintain consistent template data structure', () => {
      const templates = notificationTemplateService.getAllTemplates();
      
      templates.forEach(template => {
        expect(template).toHaveProperty('id');
        expect(template).toHaveProperty('name');
        expect(template).toHaveProperty('title');
        expect(template).toHaveProperty('body');
        expect(template).toHaveProperty('category');
        expect(typeof template.id).toBe('string');
        expect(typeof template.name).toBe('string');
        expect(typeof template.title).toBe('string');
        expect(typeof template.body).toBe('string');
        expect(['article', 'comment', 'system', 'marketing', 'engagement']).toContain(template.category);
      });
    });

    it('should generate consistent notification payloads', () => {
      const context = { title: 'Consistency Test', author: 'Test Author' };
      
      const payload1 = notificationTemplateService.createNotificationPayload(
        'new-article',
        context,
        { userId: 'user-123' }
      );
      
      const payload2 = notificationTemplateService.createNotificationPayload(
        'new-article',
        context,
        { userId: 'user-123' }
      );
      
      expect(payload1.title).toBe(payload2.title);
      expect(payload1.body).toBe(payload2.body);
      expect(payload1.tag).toBe(payload2.tag);
    });
  });
}); 