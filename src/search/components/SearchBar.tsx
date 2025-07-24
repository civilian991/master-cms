'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Search,
  Mic,
  Camera,
  Loader2,
  X,
  TrendingUp,
  Clock,
  Sparkles,
} from 'lucide-react';

import {
  SearchBarProps,
  Suggestion,
  VoiceSearchResult,
} from '../types/search.types';

export function SearchBar({
  placeholder = 'Search...',
  initialValue = '',
  autoComplete = true,
  voiceSearch = false,
  visualSearch = false,
  onSearch,
  onSuggestionClick,
  onVoiceResult,
  onImageUpload,
  isLoading = false,
  disabled = false,
  className = '',
}: SearchBarProps) {
  // State
  const [query, setQuery] = useState(initialValue);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);

  // Refs
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle search
  const handleSearch = useCallback((searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (finalQuery.trim()) {
      onSearch(finalQuery.trim());
      setShowSuggestions(false);
    }
  }, [query, onSearch]);

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Show/hide suggestions based on input
    if (value.trim() && autoComplete) {
      setShowSuggestions(true);
      // Mock suggestions for demo - in real app, this would call an API
      setSuggestions([
        { text: value + ' articles', type: 'query', score: 1, highlighted: value },
        { text: value + ' tutorials', type: 'query', score: 0.9, highlighted: value },
        { text: value + ' guides', type: 'query', score: 0.8, highlighted: value },
      ]);
    } else {
      setShowSuggestions(false);
    }
  }, [autoComplete]);

  // Handle key press
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
    }
  }, [handleSearch]);

  // Handle suggestion click
  const handleSuggestionClick = useCallback((suggestion: Suggestion) => {
    setQuery(suggestion.text);
    setShowSuggestions(false);
    onSuggestionClick?.(suggestion);
    handleSearch(suggestion.text);
  }, [onSuggestionClick, handleSearch]);

  // Voice search functionality
  const startVoiceSearch = useCallback(() => {
    if (!voiceSearch || !('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      console.warn('Speech recognition not supported');
      return;
    }

    try {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onstart = () => {
        setIsListening(true);
        setIsRecording(true);
      };

      recognitionRef.current.onresult = (event: any) => {
        const result = event.results[event.results.length - 1];
        const transcript = result.transcript;
        
        if (result.isFinal) {
          setQuery(transcript);
          handleSearch(transcript);
          
          const voiceResult: VoiceSearchResult = {
            transcript,
            confidence: result.confidence || 0.9,
            alternatives: [],
            finalResult: true,
          };
          
          onVoiceResult?.(voiceResult);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        setIsRecording(false);
      };

      recognitionRef.current.start();
    } catch (error) {
      console.error('Voice search failed:', error);
      setIsListening(false);
      setIsRecording(false);
    }
  }, [voiceSearch, handleSearch, onVoiceResult]);

  // Stop voice search
  const stopVoiceSearch = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // Handle image upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImageUpload) {
      onImageUpload(file);
    }
  }, [onImageUpload]);

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update query when initialValue changes
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  return (
    <div className={`relative w-full ${className}`}>
      {/* Main Search Input */}
      <div className="relative flex items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
            disabled={disabled || isLoading}
            className="pl-10 pr-12 py-6 text-lg"
          />
          {(isLoading || isRecording) && (
            <div className="absolute right-16 top-1/2 transform -translate-y-1/2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          )}
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery('');
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="absolute right-10 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted"
            >
              <X className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Voice Search Button */}
        {voiceSearch && (
          <Button
            variant={isRecording ? "default" : "outline"}
            size="sm"
            onClick={isRecording ? stopVoiceSearch : startVoiceSearch}
            disabled={disabled || isLoading}
            className={`ml-2 ${isRecording ? 'bg-red-500 hover:bg-red-600' : ''}`}
          >
            <Mic className={`w-4 h-4 ${isRecording ? 'text-white animate-pulse' : ''}`} />
          </Button>
        )}

        {/* Visual Search Button */}
        {visualSearch && (
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isLoading}
              className="ml-2"
            >
              <Camera className="w-4 h-4" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
          </>
        )}

        {/* Search Button */}
        <Button
          onClick={() => handleSearch()}
          disabled={disabled || isLoading || !query.trim()}
          className="ml-2"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Voice Recording Indicator */}
      {isRecording && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center justify-center text-red-600">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></div>
                <span className="text-sm font-medium">Listening... Speak now</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 mt-1 z-40 bg-background border rounded-md shadow-lg max-h-96 overflow-y-auto"
        >
          <div className="p-2">
            <div className="text-xs text-muted-foreground mb-2 px-2">
              Suggestions
            </div>
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full text-left px-3 py-2 hover:bg-muted rounded-md transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">{suggestion.text}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="w-3 h-3 text-orange-500" />
                  )}
                  {suggestion.type === 'recent' && (
                    <Clock className="w-3 h-3 text-blue-500" />
                  )}
                  {suggestion.type === 'personalized' && (
                    <Sparkles className="w-3 h-3 text-purple-500" />
                  )}
                  <Badge variant="outline" className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {suggestion.type}
                  </Badge>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchBar; 