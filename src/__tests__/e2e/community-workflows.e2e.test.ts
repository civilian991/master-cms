import { test, expect, Page, Browser, BrowserContext } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',
  timeout: 30000,
  users: {
    admin: {
      email: 'admin@test.com',
      password: 'test123',
      name: 'Admin User',
    },
    moderator: {
      email: 'moderator@test.com',
      password: 'test123',
      name: 'Moderator User',
    },
    member: {
      email: 'member@test.com',
      password: 'test123',
      name: 'Member User',
    },
    newUser: {
      email: 'newuser@test.com',
      password: 'test123',
      name: 'New User',
    },
  },
  communities: {
    public: {
      name: 'Test Public Community',
      description: 'A public community for testing',
      category: 'Technology',
    },
    private: {
      name: 'Test Private Community',
      description: 'A private community for testing',
      category: 'Business',
    },
  },
};

// Helper functions
async function login(page: Page, userType: keyof typeof TEST_CONFIG.users) {
  const user = TEST_CONFIG.users[userType];
  
  await page.goto('/auth/signin');
  await page.fill('[data-testid="email-input"]', user.email);
  await page.fill('[data-testid="password-input"]', user.password);
  await page.click('[data-testid="signin-button"]');
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard');
  await expect(page.locator('[data-testid="user-name"]')).toContainText(user.name);
}

async function createCommunity(
  page: Page,
  community: typeof TEST_CONFIG.communities.public,
  isPrivate: boolean = false
) {
  await page.goto('/communities/create');
  
  await page.fill('[data-testid="community-name"]', community.name);
  await page.fill('[data-testid="community-description"]', community.description);
  await page.selectOption('[data-testid="community-category"]', community.category);
  
  if (isPrivate) {
    await page.check('[data-testid="community-private"]');
  }
  
  await page.click('[data-testid="create-community-button"]');
  await page.waitForURL('/communities/*');
  
  // Verify community creation
  await expect(page.locator('[data-testid="community-title"]')).toContainText(community.name);
}

async function createPost(page: Page, title: string, content: string) {
  await page.click('[data-testid="create-post-button"]');
  await page.fill('[data-testid="post-title"]', title);
  await page.fill('[data-testid="post-content"]', content);
  await page.click('[data-testid="publish-post-button"]');
  
  // Wait for post to appear
  await expect(page.locator('[data-testid="post-title"]').first()).toContainText(title);
}

async function waitForNetworkIdle(page: Page, timeout: number = 5000) {
  return page.waitForLoadState('networkidle', { timeout });
}

// Test suites
test.describe('Community Management Workflows', () => {
  let browser: Browser;
  let adminContext: BrowserContext;
  let memberContext: BrowserContext;
  let adminPage: Page;
  let memberPage: Page;

  test.beforeAll(async ({ browser: b }) => {
    browser = b;
    
    // Create contexts for different users
    adminContext = await browser.newContext();
    memberContext = await browser.newContext();
    
    adminPage = await adminContext.newPage();
    memberPage = await memberContext.newPage();
    
    // Login users
    await login(adminPage, 'admin');
    await login(memberPage, 'member');
  });

  test.afterAll(async () => {
    await adminContext.close();
    await memberContext.close();
  });

  test('should create and manage a public community', async () => {
    // Admin creates community
    await createCommunity(adminPage, TEST_CONFIG.communities.public);
    
    const communityUrl = adminPage.url();
    
    // Verify community details
    await expect(adminPage.locator('[data-testid="community-description"]'))
      .toContainText(TEST_CONFIG.communities.public.description);
    await expect(adminPage.locator('[data-testid="community-category"]'))
      .toContainText(TEST_CONFIG.communities.public.category);
    
    // Member joins community
    await memberPage.goto(communityUrl);
    await memberPage.click('[data-testid="join-community-button"]');
    
    // Verify member joined
    await expect(memberPage.locator('[data-testid="leave-community-button"]')).toBeVisible();
    
    // Admin sees increased member count
    await adminPage.reload();
    await expect(adminPage.locator('[data-testid="member-count"]')).toContainText('2');
  });

  test('should handle community moderation workflow', async () => {
    // Create community and add member
    await createCommunity(adminPage, {
      name: 'Moderation Test Community',
      description: 'Testing moderation features',
      category: 'General',
    });
    
    const communityUrl = adminPage.url();
    
    // Member joins and creates a post
    await memberPage.goto(communityUrl);
    await memberPage.click('[data-testid="join-community-button"]');
    await createPost(memberPage, 'Test Post for Moderation', 'This is a test post that might need moderation.');
    
    // Admin sees the post and can moderate it
    await adminPage.reload();
    await adminPage.click('[data-testid="moderation-menu"]');
    await adminPage.click('[data-testid="flag-post-button"]');
    
    // Verify post is flagged
    await expect(adminPage.locator('[data-testid="flagged-post-indicator"]')).toBeVisible();
    
    // Admin can approve or remove the post
    await adminPage.click('[data-testid="approve-post-button"]');
    await expect(adminPage.locator('[data-testid="flagged-post-indicator"]')).not.toBeVisible();
  });

  test('should manage community settings and permissions', async () => {
    await createCommunity(adminPage, {
      name: 'Settings Test Community',
      description: 'Testing community settings',
      category: 'Technology',
    });
    
    // Admin accesses community settings
    await adminPage.click('[data-testid="community-settings-button"]');
    
    // Update community settings
    await adminPage.fill('[data-testid="community-description"]', 'Updated description for testing');
    await adminPage.check('[data-testid="require-approval"]');
    await adminPage.click('[data-testid="save-settings-button"]');
    
    // Verify settings saved
    await expect(adminPage.locator('[data-testid="community-description"]'))
      .toContainText('Updated description for testing');
    
    // Test permission changes - member tries to join
    const communityUrl = adminPage.url().replace('/settings', '');
    await memberPage.goto(communityUrl);
    await memberPage.click('[data-testid="join-community-button"]');
    
    // Should show pending approval status
    await expect(memberPage.locator('[data-testid="pending-approval-message"]')).toBeVisible();
    
    // Admin can approve the request
    await adminPage.click('[data-testid="member-requests-tab"]');
    await adminPage.click('[data-testid="approve-member-button"]');
    
    // Member should now be in the community
    await memberPage.reload();
    await expect(memberPage.locator('[data-testid="leave-community-button"]')).toBeVisible();
  });
});

test.describe('Content Creation and Interaction Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await login(page, 'member');
  });

  test('should create and interact with posts', async () => {
    // Navigate to a community
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    
    // Create a new post
    const postTitle = 'Test Post Title';
    const postContent = 'This is test post content with some details.';
    
    await createPost(page, postTitle, postContent);
    
    // Verify post appears in feed
    await expect(page.locator('[data-testid="post-title"]').first()).toContainText(postTitle);
    
    // Interact with the post
    await page.click('[data-testid="like-button"]');
    await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
    
    // Add a comment
    await page.click('[data-testid="comment-button"]');
    await page.fill('[data-testid="comment-input"]', 'This is a test comment');
    await page.click('[data-testid="submit-comment-button"]');
    
    // Verify comment appears
    await expect(page.locator('[data-testid="comment-text"]').first())
      .toContainText('This is a test comment');
    
    // Share the post
    await page.click('[data-testid="share-button"]');
    // Note: Actual sharing depends on browser permissions and share API
  });

  test('should handle rich content posts', async () => {
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    
    // Create post with image
    await page.click('[data-testid="create-post-button"]');
    await page.fill('[data-testid="post-title"]', 'Post with Image');
    await page.fill('[data-testid="post-content"]', 'This post includes an image attachment.');
    
    // Upload image (mock file upload)
    const fileInput = page.locator('[data-testid="image-upload"]');
    await fileInput.setInputFiles({
      name: 'test-image.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-data'),
    });
    
    await page.click('[data-testid="publish-post-button"]');
    
    // Verify image appears in post
    await expect(page.locator('[data-testid="post-image"]').first()).toBeVisible();
  });

  test('should handle post editing and deletion', async () => {
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    
    // Create a post to edit
    await createPost(page, 'Editable Post', 'Original content');
    
    // Edit the post
    await page.click('[data-testid="post-menu-button"]').first();
    await page.click('[data-testid="edit-post-button"]');
    
    await page.fill('[data-testid="post-title"]', 'Edited Post Title');
    await page.fill('[data-testid="post-content"]', 'Updated content');
    await page.click('[data-testid="save-post-button"]');
    
    // Verify changes
    await expect(page.locator('[data-testid="post-title"]').first())
      .toContainText('Edited Post Title');
    
    // Delete the post
    await page.click('[data-testid="post-menu-button"]').first();
    await page.click('[data-testid="delete-post-button"]');
    await page.click('[data-testid="confirm-delete-button"]');
    
    // Verify post is removed
    await expect(page.locator('[data-testid="post-title"]').first())
      .not.toContainText('Edited Post Title');
  });
});

test.describe('Social Features and Gamification Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await login(page, 'member');
  });

  test('should handle user following and activity feeds', async () => {
    // Navigate to another user's profile
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    await page.click('[data-testid="member-avatar"]').first();
    
    // Follow the user
    await page.click('[data-testid="follow-user-button"]');
    await expect(page.locator('[data-testid="unfollow-user-button"]')).toBeVisible();
    
    // Check activity feed
    await page.goto('/feed');
    await expect(page.locator('[data-testid="activity-item"]')).toBeVisible();
    
    // Verify followed user's activities appear
    await expect(page.locator('[data-testid="activity-type"]').first())
      .toContainText('followed');
  });

  test('should track achievements and badges', async () => {
    // Navigate to profile to check initial achievements
    await page.goto('/profile');
    
    const initialBadgeCount = await page.locator('[data-testid="badge-count"]').textContent();
    
    // Perform actions that should trigger achievements
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    
    // Create multiple posts to trigger achievement
    for (let i = 0; i < 3; i++) {
      await createPost(page, `Achievement Post ${i + 1}`, `Content for post ${i + 1}`);
      await waitForNetworkIdle(page);
    }
    
    // Check for new achievements
    await page.goto('/profile');
    await expect(page.locator('[data-testid="achievement-notification"]')).toBeVisible();
    
    // Verify badge count increased
    const newBadgeCount = await page.locator('[data-testid="badge-count"]').textContent();
    expect(parseInt(newBadgeCount || '0')).toBeGreaterThan(parseInt(initialBadgeCount || '0'));
  });

  test('should display leaderboards and reputation', async () => {
    await page.goto('/leaderboard');
    
    // Verify leaderboard displays
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-rank"]')).toBeVisible();
    
    // Check different leaderboard categories
    await page.click('[data-testid="weekly-leaderboard"]');
    await waitForNetworkIdle(page);
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
    
    await page.click('[data-testid="monthly-leaderboard"]');
    await waitForNetworkIdle(page);
    await expect(page.locator('[data-testid="leaderboard-table"]')).toBeVisible();
  });
});

test.describe('Event Management Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await login(page, 'admin');
  });

  test('should create and manage community events', async () => {
    await page.goto('/communities');
    await page.click('[data-testid="community-card"]').first();
    
    // Create an event
    await page.click('[data-testid="events-tab"]');
    await page.click('[data-testid="create-event-button"]');
    
    const eventData = {
      title: 'Community Meetup',
      description: 'Monthly community meetup event',
      date: '2024-12-25',
      time: '14:00',
      location: 'Virtual Event',
    };
    
    await page.fill('[data-testid="event-title"]', eventData.title);
    await page.fill('[data-testid="event-description"]', eventData.description);
    await page.fill('[data-testid="event-date"]', eventData.date);
    await page.fill('[data-testid="event-time"]', eventData.time);
    await page.fill('[data-testid="event-location"]', eventData.location);
    
    await page.click('[data-testid="create-event-button"]');
    
    // Verify event creation
    await expect(page.locator('[data-testid="event-title"]').first())
      .toContainText(eventData.title);
  });

  test('should handle event registration and attendance', async () => {
    // Switch to member account
    await login(page, 'member');
    
    await page.goto('/events');
    
    // Register for an event
    await page.click('[data-testid="event-card"]').first();
    await page.click('[data-testid="register-event-button"]');
    
    // Verify registration
    await expect(page.locator('[data-testid="registered-indicator"]')).toBeVisible();
    
    // Check event appears in user's calendar
    await page.goto('/profile/events');
    await expect(page.locator('[data-testid="registered-event"]')).toBeVisible();
  });
});

test.describe('Mobile and PWA Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await login(page, 'member');
  });

  test('should work on mobile devices', async () => {
    await page.goto('/communities');
    
    // Test mobile navigation
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test swipe gestures (simulated)
    await page.click('[data-testid="community-card"]').first();
    
    // Test pull-to-refresh (simulated)
    await page.evaluate(() => {
      window.scrollTo(0, 0);
    });
    
    // Test touch interactions
    await page.click('[data-testid="like-button"]');
    await expect(page.locator('[data-testid="like-count"]')).toContainText('1');
  });

  test('should work offline', async () => {
    // Go offline
    await page.context().setOffline(true);
    
    await page.goto('/communities');
    
    // Should show cached content
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Try to create a post offline
    await page.click('[data-testid="community-card"]').first();
    await page.click('[data-testid="create-post-button"]');
    
    await page.fill('[data-testid="post-title"]', 'Offline Post');
    await page.fill('[data-testid="post-content"]', 'This post was created offline');
    await page.click('[data-testid="publish-post-button"]');
    
    // Should show queued indicator
    await expect(page.locator('[data-testid="queued-post-indicator"]')).toBeVisible();
    
    // Go back online
    await page.context().setOffline(false);
    await page.reload();
    
    // Post should sync and appear
    await expect(page.locator('[data-testid="post-title"]').first())
      .toContainText('Offline Post');
  });
});

test.describe('Analytics and Monitoring Workflows', () => {
  let page: Page;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    await login(page, 'admin');
  });

  test('should display community analytics', async () => {
    await page.goto('/analytics');
    
    // Verify analytics dashboard loads
    await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-metrics"]')).toBeVisible();
    await expect(page.locator('[data-testid="content-metrics"]')).toBeVisible();
    
    // Test different time ranges
    await page.click('[data-testid="time-range-selector"]');
    await page.click('[data-testid="time-range-7d"]');
    await waitForNetworkIdle(page);
    
    // Verify data updates
    await expect(page.locator('[data-testid="analytics-overview"]')).toBeVisible();
  });

  test('should export analytics data', async () => {
    await page.goto('/analytics');
    
    // Test data export
    const downloadPromise = page.waitForEvent('download');
    await page.click('[data-testid="export-data-button"]');
    await page.click('[data-testid="export-csv-button"]');
    
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toMatch(/analytics.*\.csv/);
  });
});

test.describe('Security and Moderation Workflows', () => {
  let adminPage: Page;
  let memberPage: Page;

  test.beforeEach(async ({ browser }) => {
    const adminContext = await browser.newContext();
    const memberContext = await browser.newContext();
    
    adminPage = await adminContext.newPage();
    memberPage = await memberContext.newPage();
    
    await login(adminPage, 'admin');
    await login(memberPage, 'member');
  });

  test('should handle content moderation', async () => {
    // Member creates potentially problematic content
    await memberPage.goto('/communities');
    await memberPage.click('[data-testid="community-card"]').first();
    
    await createPost(memberPage, 'Flagged Content', 'This content might be inappropriate');
    
    // Admin sees moderation alert
    await adminPage.goto('/moderation');
    await expect(adminPage.locator('[data-testid="moderation-queue"]')).toBeVisible();
    
    // Admin can review and take action
    await adminPage.click('[data-testid="review-content-button"]');
    await adminPage.click('[data-testid="approve-content-button"]');
    
    // Verify content status updated
    await expect(adminPage.locator('[data-testid="content-approved"]')).toBeVisible();
  });

  test('should handle user reporting', async () => {
    // Member reports another user's content
    await memberPage.goto('/communities');
    await memberPage.click('[data-testid="community-card"]').first();
    
    await memberPage.click('[data-testid="post-menu-button"]').first();
    await memberPage.click('[data-testid="report-post-button"]');
    
    await memberPage.selectOption('[data-testid="report-reason"]', 'spam');
    await memberPage.fill('[data-testid="report-details"]', 'This appears to be spam content');
    await memberPage.click('[data-testid="submit-report-button"]');
    
    // Admin receives report
    await adminPage.goto('/moderation/reports');
    await expect(adminPage.locator('[data-testid="new-report"]')).toBeVisible();
    
    // Admin can investigate and resolve
    await adminPage.click('[data-testid="investigate-report-button"]');
    await adminPage.click('[data-testid="resolve-report-button"]');
  });
});

test.describe('Performance and Load Testing', () => {
  test('should handle concurrent users', async ({ browser }) => {
    const contexts = await Promise.all(
      Array.from({ length: 5 }, () => browser.newContext())
    );
    
    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );
    
    // Login multiple users concurrently
    await Promise.all(
      pages.map((page, index) => login(page, index % 2 === 0 ? 'member' : 'admin'))
    );
    
    // Perform actions concurrently
    await Promise.all(
      pages.map(async (page, index) => {
        await page.goto('/communities');
        await page.click('[data-testid="community-card"]').first();
        
        if (index % 2 === 0) {
          await createPost(page, `Concurrent Post ${index}`, `Content from user ${index}`);
        } else {
          await page.click('[data-testid="like-button"]');
        }
      })
    );
    
    // Verify all actions completed successfully
    for (const page of pages) {
      await expect(page.locator('[data-testid="community-title"]')).toBeVisible();
    }
    
    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });

  test('should load pages within performance budgets', async ({ page }) => {
    await login(page, 'member');
    
    // Measure page load performance
    const startTime = Date.now();
    await page.goto('/communities');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Verify performance budget (under 3 seconds)
    expect(loadTime).toBeLessThan(3000);
    
    // Check for performance metrics
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.navigationStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      };
    });
    
    expect(performanceMetrics.loadTime).toBeLessThan(3000);
    expect(performanceMetrics.firstContentfulPaint).toBeLessThan(1500);
  });
}); 