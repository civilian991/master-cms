import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SearchHub } from '@/search/components/SearchHub';

// Mock the search API
jest.mock('@/search/services/searchApi', () => ({
  searchApi: {
    search: jest.fn(),
    autoComplete: jest.fn(),
    getTrendingSuggestions: jest.fn(),
    getPopularSuggestions: jest.fn(),
    getRecommendations: jest.fn(),
    trackSearchEvent: jest.fn(),
  },
}));

// Mock the hooks
jest.mock('@/search/hooks/useSearch', () => ({
  useSearch: jest.fn(() => ({
    results: [],
    facets: [],
    suggestions: [],
    recommendations: [],
    metadata: null,
    isLoading: false,
    error: null,
    search: jest.fn(),
    clearResults: jest.fn(),
    searchResults: null,
    isSearching: false,
    searchError: null,
    performSearch: jest.fn(),
  })),
}));

jest.mock('@/search/hooks/useAutocomplete', () => ({
  useAutoComplete: jest.fn(() => ({
    suggestions: [],
    isLoading: false,
    error: null,
    getSuggestions: jest.fn(),
    clearSuggestions: jest.fn(),
  })),
}));

jest.mock('@/search/hooks/useRecommendations', () => ({
  useRecommendations: jest.fn(() => ({
    recommendations: [],
    isLoading: false,
    error: null,
    getRecommendations: jest.fn(),
    clearRecommendations: jest.fn(),
  })),
}));

jest.mock('@/search/hooks/useTrending', () => ({
  useTrending: jest.fn(() => ({
    trending: [],
    popular: [],
    isLoading: false,
    error: null,
    getTrending: jest.fn(),
    getPopular: jest.fn(),
    clearTrending: jest.fn(),
  })),
}));

describe('SearchHub', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search hub with main title', () => {
    render(<SearchHub />);
    
    expect(screen.getByText('Search Everything')).toBeInTheDocument();
    expect(screen.getByText(/Discover content with AI-powered search/)).toBeInTheDocument();
  });

  it('renders search bar with placeholder', () => {
    render(<SearchHub />);
    
    const searchInput = screen.getByPlaceholderText(/Search articles, media, users/);
    expect(searchInput).toBeInTheDocument();
  });

  it('displays search controls', () => {
    render(<SearchHub />);
    
    expect(screen.getByText('All Content')).toBeInTheDocument();
    expect(screen.getByText('Instant')).toBeInTheDocument();
    expect(screen.getByText('Relevance')).toBeInTheDocument();
    expect(screen.getByText('Filters')).toBeInTheDocument();
  });

  it('shows empty state when no query', () => {
    render(<SearchHub />);
    
    expect(screen.getByText('Discover Amazing Content')).toBeInTheDocument();
    expect(screen.getByText(/Start typing to search/)).toBeInTheDocument();
  });

  it('handles search input change', async () => {
    const mockOnSearch = jest.fn();
    render(<SearchHub onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search articles, media, users/);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    await waitFor(() => {
      expect(searchInput).toHaveValue('test query');
    });
  });

  it('handles scope change', () => {
    render(<SearchHub />);
    
    const scopeSelect = screen.getByText('All Content');
    fireEvent.click(scopeSelect);
    
    expect(screen.getByText('Articles')).toBeInTheDocument();
    expect(screen.getByText('Pages')).toBeInTheDocument();
    expect(screen.getByText('Media')).toBeInTheDocument();
  });

  it('handles search mode change', () => {
    render(<SearchHub />);
    
    const modeSelect = screen.getByText('Instant');
    fireEvent.click(modeSelect);
    
    expect(screen.getByText('Semantic')).toBeInTheDocument();
    expect(screen.getByText('Fuzzy')).toBeInTheDocument();
  });

  it('handles sort order change', () => {
    render(<SearchHub />);
    
    const sortSelect = screen.getByText('Relevance');
    fireEvent.click(sortSelect);
    
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Title')).toBeInTheDocument();
    expect(screen.getByText('Popularity')).toBeInTheDocument();
  });

  it('toggles filters panel', () => {
    render(<SearchHub />);
    
    const filtersButton = screen.getByText('Filters');
    fireEvent.click(filtersButton);
    
    // Should toggle filters state
    expect(filtersButton).toBeInTheDocument();
  });

  it('toggles layout between grid and list', () => {
    render(<SearchHub />);
    
    const gridButton = screen.getByRole('button', { name: /grid/i });
    const listButton = screen.getByRole('button', { name: /list/i });
    
    expect(gridButton).toBeInTheDocument();
    expect(listButton).toBeInTheDocument();
    
    fireEvent.click(listButton);
    // Layout should change to list view
  });

  it('calls onSearch callback when search is performed', async () => {
    const mockOnSearch = jest.fn();
    render(<SearchHub onSearch={mockOnSearch} />);
    
    const searchInput = screen.getByPlaceholderText(/Search articles, media, users/);
    fireEvent.change(searchInput, { target: { value: 'test query' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalled();
    }, { timeout: 1000 });
  });

  it('calls onResultClick callback when result is clicked', () => {
    const mockOnResultClick = jest.fn();
    
    // Mock useSearch to return results
    const { useSearch } = require('@/search/hooks/useSearch');
    useSearch.mockReturnValue({
      results: [{
        id: '1',
        type: 'articles',
        title: 'Test Article',
        description: 'Test description',
        url: '/test',
        score: 1.0,
        relevance: 95,
      }],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: { totalResults: 1, hasResults: true, searchTime: 50 },
      isLoading: false,
      error: null,
      search: jest.fn(),
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: false,
      searchError: null,
      performSearch: jest.fn(),
    });
    
    render(<SearchHub onResultClick={mockOnResultClick} initialQuery="test" />);
    
    const resultCard = screen.getByText('Test Article');
    fireEvent.click(resultCard);
    
    expect(mockOnResultClick).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Test Article',
      })
    );
  });

  it('handles loading state', () => {
    const { useSearch } = require('@/search/hooks/useSearch');
    useSearch.mockReturnValue({
      results: [],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: null,
      isLoading: true,
      error: null,
      search: jest.fn(),
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: true,
      searchError: null,
      performSearch: jest.fn(),
    });
    
    render(<SearchHub initialQuery="loading test" />);
    
    expect(screen.getByText('Searching...')).toBeInTheDocument();
  });

  it('handles error state', () => {
    const { useSearch } = require('@/search/hooks/useSearch');
    useSearch.mockReturnValue({
      results: [],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: null,
      isLoading: false,
      error: 'Search failed',
      search: jest.fn(),
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: false,
      searchError: 'Search failed',
      performSearch: jest.fn(),
    });
    
    render(<SearchHub initialQuery="error test" />);
    
    expect(screen.getByText('Search Error')).toBeInTheDocument();
    expect(screen.getByText('Search failed')).toBeInTheDocument();
  });

  it('shows no results message when search returns empty', () => {
    const { useSearch } = require('@/search/hooks/useSearch');
    useSearch.mockReturnValue({
      results: [],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: { totalResults: 0, hasResults: false, searchTime: 25 },
      isLoading: false,
      error: null,
      search: jest.fn(),
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: false,
      searchError: null,
      performSearch: jest.fn(),
    });
    
    render(<SearchHub initialQuery="no results" />);
    
    expect(screen.getByText('No results found')).toBeInTheDocument();
    expect(screen.getByText(/Try adjusting your search terms/)).toBeInTheDocument();
  });

  it('displays search metadata', () => {
    const { useSearch } = require('@/search/hooks/useSearch');
    useSearch.mockReturnValue({
      results: [{
        id: '1',
        type: 'articles',
        title: 'Test Article',
        description: 'Test description',
        url: '/test',
        score: 1.0,
        relevance: 95,
      }],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: { 
        totalResults: 42, 
        hasResults: true, 
        searchTime: 123,
        currentPage: 1,
        totalPages: 3,
        resultsPerPage: 20,
      },
      isLoading: false,
      error: null,
      search: jest.fn(),
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: false,
      searchError: null,
      performSearch: jest.fn(),
    });
    
    render(<SearchHub initialQuery="metadata test" />);
    
    expect(screen.getByText(/42 results found in 123ms/)).toBeInTheDocument();
  });
});

describe('SearchHub Integration', () => {
  it('integrates with all search hooks correctly', () => {
    const mockSearch = jest.fn();
    const mockGetSuggestions = jest.fn();
    const mockGetRecommendations = jest.fn();
    const mockGetTrending = jest.fn();

    const { useSearch } = require('@/search/hooks/useSearch');
    const { useAutoComplete } = require('@/search/hooks/useAutocomplete');
    const { useRecommendations } = require('@/search/hooks/useRecommendations');
    const { useTrending } = require('@/search/hooks/useTrending');

    useSearch.mockReturnValue({
      results: [],
      facets: [],
      suggestions: [],
      recommendations: [],
      metadata: null,
      isLoading: false,
      error: null,
      search: mockSearch,
      clearResults: jest.fn(),
      searchResults: null,
      isSearching: false,
      searchError: null,
      performSearch: mockSearch,
    });

    useAutoComplete.mockReturnValue({
      suggestions: [],
      isLoading: false,
      error: null,
      getSuggestions: mockGetSuggestions,
      clearSuggestions: jest.fn(),
    });

    useRecommendations.mockReturnValue({
      recommendations: [],
      isLoading: false,
      error: null,
      getRecommendations: mockGetRecommendations,
      clearRecommendations: jest.fn(),
    });

    useTrending.mockReturnValue({
      trending: [],
      popular: [],
      isLoading: false,
      error: null,
      getTrending: mockGetTrending,
      getPopular: jest.fn(),
      clearTrending: jest.fn(),
    });

    render(<SearchHub />);

    // Verify hooks are called on mount
    expect(mockGetTrending).toHaveBeenCalled();
    expect(mockGetRecommendations).toHaveBeenCalledWith('trending');
  });
});

export {}; 