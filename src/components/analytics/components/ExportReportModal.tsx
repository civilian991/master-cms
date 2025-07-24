'use client';

import React, { useState } from 'react';
import { X, Download, FileText, FileSpreadsheet, File } from 'lucide-react';
import { ExportReportModalProps } from '../types/analytics.types';
import { analyticsApi } from '../services/analyticsApi';

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  siteId,
  availableMetrics,
  dateRange,
  onExportSuccess,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'csv' | 'pdf' | 'excel'>('csv');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(
    availableMetrics.filter(m => m.isDefault).map(m => m.id)
  );
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const exportParams = {
        format: selectedFormat,
        metrics: selectedMetrics,
        dateRange,
        siteId,
      };
      
      const response = await analyticsApi.exportData(exportParams);
      onExportSuccess?.(response);
      onClose();
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const formatIcons = {
    csv: <FileSpreadsheet className="h-5 w-5" />,
    pdf: <FileText className="h-5 w-5" />,
    excel: <File className="h-5 w-5" />,
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-25" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900">Export Analytics Report</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Export Format</label>
              <div className="grid grid-cols-3 gap-3">
                {(['csv', 'pdf', 'excel'] as const).map((format) => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`flex flex-col items-center p-3 border rounded-lg ${
                      selectedFormat === format
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {formatIcons[format]}
                    <span className="mt-1 text-xs uppercase">{format}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Metrics Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Include Metrics</label>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {availableMetrics.map((metric) => (
                  <label key={metric.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedMetrics([...selectedMetrics, metric.id]);
                        } else {
                          setSelectedMetrics(selectedMetrics.filter(id => id !== metric.id));
                        }
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-3 text-sm text-gray-700">{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <div className="text-sm text-gray-600">
                {dateRange.startDate.toLocaleDateString()} - {dateRange.endDate.toLocaleDateString()}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-8">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting || selectedMetrics.length === 0}
              className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportReportModal; 