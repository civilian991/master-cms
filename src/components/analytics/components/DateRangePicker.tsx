'use client';

import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { DateRangePickerProps, TIME_RANGES } from '../types/analytics.types';

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value,
  onChange,
  disabled = false,
  customRangeEnabled = false,
}) => {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
        <label className="text-sm font-medium text-gray-700">Time Range:</label>
      </div>
      
      <div className="relative">
        <select
          value={value.value}
          onChange={(e) => {
            const selectedRange = TIME_RANGES.find(range => range.value === e.target.value);
            if (selectedRange) {
              onChange(selectedRange);
            }
          }}
          disabled={disabled}
          className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-10 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {TIME_RANGES.map((range) => (
            <option key={range.value} value={range.value}>
              {range.label}
            </option>
          ))}
          {customRangeEnabled && (
            <option value="custom">Custom Range</option>
          )}
        </select>
        
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <ChevronDown className="h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      {/* Quick Range Buttons */}
      <div className="hidden md:flex items-center space-x-2">
        {TIME_RANGES.slice(0, 4).map((range) => (
          <button
            key={range.value}
            onClick={() => onChange(range)}
            disabled={disabled}
            className={`px-3 py-1 text-xs rounded-md border transition-colors ${
              value.value === range.value
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {range.label.replace('Last ', '')}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateRangePicker; 