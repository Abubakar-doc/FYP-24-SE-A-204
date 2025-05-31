import React, { useState, useRef } from 'react';
import { BsArrowUpCircle } from 'react-icons/bs';
import UploadModal from './UploadModal';
import ProcessModal from './ProcessModal';
import * as XLSX from 'xlsx';

interface StudentData {
  'Roll No': string;
  Email: string;
  Name: string;
}

const UploadFile: React.FC = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [step1Completed, setStep1Completed] = useState(false);
  const [step2Completed, setStep2Completed] = useState(false);
  const [jsonData, setJsonData] = useState<StudentData[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setErrorMessage(null);
    setSuccessMessage(null);

    if (file) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      if (fileExtension !== 'xlsx') {
        setErrorMessage('Please upload a valid .xlsx file.');
        setSelectedFile(null);
        resetProgress();
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }

      setSelectedFile(file);
      setSuccessMessage('File selected successfully. Click "Upload File" to proceed.');
    }
  };

  const resetProgress = () => {
    setProgress(0);
    setStep1Completed(false);
    setStep2Completed(false);
  };

  const handleUploadButtonClick = () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file first.');
      return;
    }

    // Step 1: Upload file
    if (!step1Completed) {
      // Simulate upload process
      setTimeout(() => {
        setProgress(50);
        setStep1Completed(true);
        setSuccessMessage('File uploaded successfully! Now click "Read File" to process it.');
      }, 500);
    } 
    // Step 2: Read file
    else if (!step2Completed) {
      readExcelFile(selectedFile);
    }
    // All steps completed - proceed to next
    else {
      setIsUploadModalOpen(false);
      setIsProcessModalOpen(true);
    }
  };

  const readExcelFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];

        // Get headers from the first row
        const headers: string[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 })[0] as string[];
        const requiredHeaders = ['Roll No', 'Email', 'Name'];
        const missingHeaders = requiredHeaders.filter(
          (header) => !headers.includes(header)
        );

        if (missingHeaders.length > 0) {
          throw new Error(
            'The Excel file must contain "Roll No", "Email", and "Name" columns as headings in the first row.'
          );
        }

        // Convert to JSON (missing values are allowed)
        const jsonData = XLSX.utils.sheet_to_json<StudentData>(worksheet);

        setJsonData(jsonData);
        setProgress(100);
        setStep2Completed(true);
        setSuccessMessage('File read successfully! Data ready for processing.');
      } catch (error) {
        setErrorMessage(
          `Error reading file: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
        console.error('Error reading file:', error);
      }
    };

    reader.onerror = () => {
      setErrorMessage('Error reading file. Please try again.');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUploadModalClose = () => {
    setIsUploadModalOpen(false);
    setErrorMessage(null);
    setSuccessMessage(null);
    setSelectedFile(null);
    resetProgress();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleProcessConfirm = () => {
    setIsProcessModalOpen(false);
    resetProcessState();
  };

  const resetProcessState = () => {
    setSelectedFile(null);
    resetProgress();
    setJsonData([]);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getButtonText = () => {
    if (!step1Completed) return 'Upload File';
    if (!step2Completed) return 'Read File';
    return 'Next';
  };

  return (
    <div className="w-full">
      <button
        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 w-80 rounded-md focus:outline-none focus:ring focus:border-blue-300 flex items-center justify-center"
        onClick={() => setIsUploadModalOpen(true)}
        type="button"
      >
        <BsArrowUpCircle className="w-5 h-5 mr-2 text-white text-2xl hover:bg-blue-700" />
        Upload .XLSX File
      </button>

      {/* Upload Modal */}
      <UploadModal 
        isOpen={isUploadModalOpen} 
        onClose={handleUploadModalClose}
        progress={progress}
        step1Completed={step1Completed}
        step2Completed={step2Completed}
      >
        <div className="flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-4">Excel File Upload Process</h2>

          {errorMessage && (
            <div className="text-red-500 mb-4 p-2 bg-red-50 rounded w-full text-center">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="text-green-600 mb-4 p-2 bg-green-50 rounded w-full text-center">
              {successMessage}
            </div>
          )}

          {/* Hidden file input */}
          {!step1Completed && (
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className='p-2'
              onChange={handleFileChange}
            />
          )}

          <button
            className={`${
              step1Completed && !step2Completed
                ? 'bg-purple-600 hover:bg-purple-700'
                : step2Completed
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-blue-500 hover:bg-blue-600'
            } text-white font-bold py-2 px-6 rounded mb-2 w-full`}
            onClick={handleUploadButtonClick}
            type="button"
          >
            {getButtonText()}
          </button>

          {selectedFile && !step1Completed && (
            <div className="text-gray-600 mt-2">
              Selected file: {selectedFile.name}
            </div>
          )}
        </div>
      </UploadModal>

      {/* Process Modal */}
      <ProcessModal
        isOpen={isProcessModalOpen}
        onClose={() => {
          setIsProcessModalOpen(false);
          resetProcessState();
        }}
        onConfirm={handleProcessConfirm}
        fileName={selectedFile?.name || ''}
        dataCount={jsonData.length}
        jsonData={jsonData}
      />
    </div>
  );
};

export default UploadFile;
