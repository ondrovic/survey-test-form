import { Button } from '@/components/common';
import { Modal } from '@/components/common';
import { useToast } from '@/contexts/toast-context';
import { ExportableDataType, getDataTypeDisplayName } from '@/utils/generic-import-export.utils';
import { AlertCircle, FileText, Upload } from 'lucide-react';
import React, { useCallback, useState, useEffect } from 'react';
import { IMPORT_CANCELLED_MESSAGE } from '@/constants/import-export.constants';

interface GenericImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (file: File) => Promise<boolean>;
  dataType?: ExportableDataType;
  title?: string;
}

export const GenericImportModal: React.FC<GenericImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  dataType,
  title
}) => {
  const { showError, showSuccess } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  // Reset modal state when it opens
  useEffect(() => {
    if (isOpen) {
      console.log("📂 Generic import modal opened - resetting state");
      setSelectedFile(null);
      setIsDragging(false);
      setIsImporting(false);
    } else {
      console.log("📂 Generic import modal closed");
    }
  }, [isOpen]);

  const displayName = dataType ? getDataTypeDisplayName(dataType) : 'Data';
  const modalTitle = title || `Import ${displayName}`;

  const handleFileSelect = useCallback((file: File) => {
    console.log("📁 File selected:", file.name, "Type:", file.type, "Size:", file.size);
    if (file.type === 'application/json' || file.name.endsWith('.json')) {
      setSelectedFile(file);
      console.log("✅ File accepted and set as selected file");
    } else {
      console.log("❌ File rejected - not a JSON file");
      showError('Please select a JSON file');
    }
  }, [showError]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    console.log("📂 File dropped on generic import modal");
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      console.log("📁 Processing dropped file:", files[0].name);
      handleFileSelect(files[0]);
    } else {
      console.log("⚠️ No files in drop event");
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
    console.log("📂 File input changed");
    const file = e.target.files?.[0];
    if (file) {
      console.log("📁 File selected from input:", file.name);
      handleFileSelect(file);
    } else {
      console.log("⚠️ No file in input event");
    }
  }, [handleFileSelect]);

  const handleImport = useCallback(async () => {
    if (!selectedFile) {
      console.log("⚠️ Import clicked but no file selected");
      return;
    }

    console.log("🚀 Starting import process for file:", selectedFile.name);
    setIsImporting(true);
    try {
      const success = await onImport(selectedFile);
      console.log("📊 Import result:", success ? "SUCCESS" : "FAILED/CANCELLED");
      if (success) {
        console.log("✅ Import successful - clearing file and closing modal");
        setSelectedFile(null);
        onClose();
      } else {
        console.log("❌ Import failed or cancelled - clearing selected file");
        setSelectedFile(null);
      }
    } finally {
      console.log("🔄 Import process finished - setting isImporting to false");
      setIsImporting(false);
    }
  }, [selectedFile, onImport, onClose]);

  const handleClose = useCallback(() => {
    if (!isImporting) {
      console.log("❌ User clicked Cancel button on generic import modal");
      console.log("📤 Showing cancel toast:", IMPORT_CANCELLED_MESSAGE);
      setSelectedFile(null);
      showSuccess(IMPORT_CANCELLED_MESSAGE);
      console.log("🚪 Closing generic import modal");
      onClose();
    } else {
      console.log("⚠️ Close attempted while importing - blocked");
    }
  }, [isImporting, onClose, showSuccess]);

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="sm"
      closable={!isImporting}
    >
      <Modal.Header>
        <Modal.Title>{modalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-3">
            Upload a JSON file exported from this system to import {dataType ? `a ${displayName.toLowerCase()}` : 'data'}.
          </p>

          {/* File Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${isDragging
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
                  onClick={() => {
                    console.log("🗑️ User clicked Remove button - clearing selected file");
                    setSelectedFile(null);
                  }}
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
                  id="generic-file-input"
                  disabled={isImporting}
                />
                <label
                  htmlFor="generic-file-input"
                  className={`inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer ${isImporting ? 'opacity-50 cursor-not-allowed' : ''
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
              <ul className="text-xs space-y-1 space-x-1">
                <li>• All data will be preserved exactly as exported (no renaming or modifications)</li>
                <li>• Original IDs will be maintained for data consistency</li>
                <li>• Active status, date ranges, and all settings will be preserved</li>
                <li>• Only the updatedAt timestamp will be refreshed to track the import</li>
                {!dataType && <li>• Auto-detection will determine the data type from file structure</li>}
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
                Import {dataType ? displayName : 'Data'}
              </>
            )}
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
};