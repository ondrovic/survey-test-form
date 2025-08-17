import { Button } from '@/components/common';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface ImportConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<boolean>;
}

export const ImportConfigModal: React.FC<ImportConfigModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      setSelectedFile(file);
    } else {
      alert('Please select a JSON file');
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!selectedFile) return;
    
    setIsImporting(true);
    try {
      const success = await onImport(selectedFile);
      if (success) {
        setSelectedFile(null);
        onClose();
      }
    } finally {
      setIsImporting(false);
    }
  }, [selectedFile, onImport, onClose]);

  const handleClose = useCallback(() => {
    if (!isImporting) {
      setSelectedFile(null);
      onClose();
    }
  }, [isImporting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Import Survey Config</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              disabled={isImporting}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="mb-4">
            <p className="text-sm text-gray-600 mb-3">
              Upload a JSON file exported from this system to import a survey configuration.
            </p>

            {/* File Drop Zone */}
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                isDragging 
                  ? 'border-blue-400 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {selectedFile ? (
                <div className="flex items-center justify-center flex-col">
                  <FileText className="w-8 h-8 text-green-500 mb-2" />
                  <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="mt-2"
                    disabled={isImporting}
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-2">
                    Drop a JSON file here or click to browse
                  </p>
                  <input
                    type="file"
                    accept=".json,application/json"
                    onChange={handleFileInput}
                    className="hidden"
                    id="config-file-input"
                    disabled={isImporting}
                  />
                  <label 
                    htmlFor="config-file-input"
                    className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${
                      isImporting ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Browse Files
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Info Section */}
          <div className="mb-6 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Import Notes:</p>
                <ul className="text-xs space-y-1">
                  <li>• The imported config will be renamed with &quot;(Imported)&quot; suffix</li>
                  <li>• New unique IDs will be generated for all sections and fields</li>
                  <li>• The config will be created as active by default</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={handleClose}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleImport}
              disabled={!selectedFile || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Importing...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Config
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};