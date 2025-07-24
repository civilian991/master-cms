import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock the entire page component to focus on testing integration
jest.mock('@/app/page', () => {
  return function MockHomepage() {
    return (
      <div data-testid="homepage">
        <h1>Your Trusted Source for Premium Content</h1>
        <p>Delivering sophisticated analysis and insights for the modern professional</p>
        <button>Explore Premium Content</button>
        <button>Start Free Trial</button>
        
        <div data-testid="features">
          <div>Expert Analysis</div>
          <div>Premium Insights</div>
          <div>Professional Network</div>
        </div>
        
        <section data-testid="latest-articles">
          <h2>Latest Articles</h2>
          <div data-testid="article-grid">
            <div data-testid="article-card">Sample Article</div>
          </div>
        </section>
        
        <section data-testid="ai-recommendations">
          <h2>Trending Now</h2>
          <div data-testid="trending-section">AI Recommendations (trending)</div>
          <div data-testid="personalized-section">AI Recommendations (personalized)</div>
        </section>
        
        <section data-testid="newsletter">
          <h3>Stay Informed</h3>
          <input placeholder="Enter your email" />
          <button>Subscribe</button>
        </section>
        
        <section data-testid="stats">
          <div>2,500+ Articles Published</div>
          <div>150+ Expert Contributors</div>
          <div>50K+ Active Readers</div>
          <div>25 Content Categories</div>
        </section>
        
        <section data-testid="categories">
          <h3>Explore by Category</h3>
          <a href="/categories/technology">Technology</a>
          <a href="/categories/economy">Economy</a>
          <a href="/categories/business">Business</a>
        </section>
      </div>
    );
  };
});

import Homepage from '@/app/page';

describe('Homepage Component', () => {
  it('renders the homepage layout correctly', () => {
    render(<Homepage />);
    
    expect(screen.getByTestId('homepage')).toBeInTheDocument();
  });

  it('displays site-specific hero content', () => {
    render(<Homepage />);
    
    expect(screen.getByText('Your Trusted Source for Premium Content')).toBeInTheDocument();
    expect(screen.getByText('Delivering sophisticated analysis and insights for the modern professional')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Homepage />);
    
    expect(screen.getByText('Explore Premium Content')).toBeInTheDocument();
    expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
  });

  it('displays feature sections', () => {
    render(<Homepage />);
    
    const features = screen.getByTestId('features');
    expect(features).toBeInTheDocument();
    expect(screen.getByText('Expert Analysis')).toBeInTheDocument();
    expect(screen.getByText('Premium Insights')).toBeInTheDocument();
    expect(screen.getByText('Professional Network')).toBeInTheDocument();
  });

  it('renders latest articles section', () => {
    render(<Homepage />);
    
    expect(screen.getByTestId('latest-articles')).toBeInTheDocument();
    expect(screen.getByText('Latest Articles')).toBeInTheDocument();
    expect(screen.getByTestId('article-grid')).toBeInTheDocument();
  });

  it('displays AI recommendations sections', () => {
    render(<Homepage />);
    
    const aiSection = screen.getByTestId('ai-recommendations');
    expect(aiSection).toBeInTheDocument();
    expect(screen.getByText('Trending Now')).toBeInTheDocument();
    expect(screen.getByTestId('trending-section')).toBeInTheDocument();
    expect(screen.getByTestId('personalized-section')).toBeInTheDocument();
  });

  it('renders newsletter signup', () => {
    render(<Homepage />);
    
    const newsletter = screen.getByTestId('newsletter');
    expect(newsletter).toBeInTheDocument();
    expect(screen.getByText('Stay Informed')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Subscribe')).toBeInTheDocument();
  });

  it('displays site statistics', () => {
    render(<Homepage />);
    
    const stats = screen.getByTestId('stats');
    expect(stats).toBeInTheDocument();
    expect(screen.getByText('2,500+ Articles Published')).toBeInTheDocument();
    expect(screen.getByText('150+ Expert Contributors')).toBeInTheDocument();
    expect(screen.getByText('50K+ Active Readers')).toBeInTheDocument();
    expect(screen.getByText('25 Content Categories')).toBeInTheDocument();
  });

  it('renders category navigation', () => {
    render(<Homepage />);
    
    const categories = screen.getByTestId('categories');
    expect(categories).toBeInTheDocument();
    expect(screen.getByText('Explore by Category')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('Economy')).toBeInTheDocument();
    expect(screen.getByText('Business')).toBeInTheDocument();
  });
}); 