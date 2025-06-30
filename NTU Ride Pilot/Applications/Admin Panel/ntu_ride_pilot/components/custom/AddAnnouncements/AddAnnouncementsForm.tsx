"use client";
import React, { useState, useRef, useEffect } from 'react';
import AddAnnouncementsHeader from './AddAnnouncementsHeader';
import { firestore } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { useSearchParams } from 'next/navigation';
import { FaFilePdf, FaFileImage, FaFileAlt } from 'react-icons/fa';

const CLOUDINARY_UPLOAD_PRESET = 'unsigned_preset';

type AddAnnouncementsFormProps = {
  onBack: () => void;
};

const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'application/pdf',
];

// ===== UPDATED LIMITS =====
const MAX_FILES_COUNT = 5; // was 3
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB, was 2MB
const MAX_PDF_SIZE_BYTES = 10 * 1024 * 1024;   // 10MB, was 5MB
// ==========================

const getFileIcon = (file: File) => {
  if (file.type === 'application/pdf') return <FaFilePdf className="text-red-600 w-5 h-5" />;
  if (file.type.startsWith('image/')) return <FaFileImage className="text-blue-600 w-5 h-5" />;
  return <FaFileAlt className="text-gray-600 w-5 h-5" />;
};

// Upload file returns { url, publicId }
// const uploadFileToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
//   const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
//   if (!cloudName) {
//     throw new Error('Cloudinary cloud name not set in environment variables');
//   }
//   const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
//   const formData = new FormData();
//   formData.append('file', file);
//   formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

//   const response = await fetch(url, {
//     method: 'POST',
//     body: formData,
//   });

//   if (!response.ok) {
//     throw new Error('Failed to upload file to Cloudinary');
//   }

//   const data = await response.json();
//   return { url: data.secure_url, publicId: data.public_id };
// };

const uploadFileToCloudinary = async (file: File): Promise<{ url: string; publicId: string }> => {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  if (!cloudName) {
    throw new Error('Cloudinary cloud name not set in environment variables');
  }

  const fileName = file.name.split('.').slice(0, -1).join('.'); // Get the original file name without extension
  const fileExtension = file.name.split('.').pop(); // Get the file extension

  // Set the public ID to the original file name (without the extension)
  const publicId = fileName; // You can customize this if needed (e.g., add a timestamp or other unique identifiers)

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/upload`;
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('public_id', publicId);  // Set the custom public ID

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Cloudinary');
  }

  const data = await response.json();
  return { url: data.secure_url, publicId: data.public_id };
};


const AddAnnouncementsForm: React.FC<AddAnnouncementsFormProps> = ({ onBack }) => {
  const titleRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [showNotification, setShowNotification] = useState(false);

  // View mode state
  const [isViewMode, setIsViewMode] = useState(false);
  const [viewAnnouncement, setViewAnnouncement] = useState<any>(null);

  // For media preview in view mode
  const [mediaLinks, setMediaLinks] = useState<string[]>([]);

  const searchParams = useSearchParams();

  useEffect(() => {
    const viewId = searchParams.get('view');
    if (viewId) {
      setIsViewMode(true);
      setLoading(true);
      // Fetch announcement document
      const fetchAnnouncement = async () => {
        try {
          const docRef = doc(firestore, 'announcements', viewId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setViewAnnouncement(data);
            setMediaLinks(data.mediaLinks || []);
            // Populate refs
            if (titleRef.current) titleRef.current.value = data.title || '';
            if (messageRef.current) messageRef.current.value = data.message || '';
          }
        } catch (err) {
          setErrorMessage('Failed to fetch announcement for viewing.');
          setShowNotification(true);
        }
        setLoading(false);
      };
      fetchAnnouncement();
    }
   
  }, [searchParams]);

  const showNotificationMessage = (
    message: string,
    type: 'success' | 'error' | 'warning' = 'error'
  ) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setErrorMessage('');
      setWarningMessage('');
    } else if (type === 'error') {
      setErrorMessage(message);
      setSuccessMessage('');
      setWarningMessage('');
    } else {
      setWarningMessage(message);
      setSuccessMessage('');
      setErrorMessage('');
    }
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleReset = () => {
    if (titleRef.current) titleRef.current.value = '';
    if (messageRef.current) messageRef.current.value = '';
    setFiles([]);
    setShowNotification(false);
    setSuccessMessage('');
    setErrorMessage('');
    setWarningMessage('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);

      if (files.length + selectedFiles.length > MAX_FILES_COUNT) {
        showNotificationMessage(`You can upload a maximum of ${MAX_FILES_COUNT} media files.`, 'warning');
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const validFiles = selectedFiles.filter(
        (file) => ALLOWED_MIME_TYPES.includes(file.type)
      );

      if (selectedFiles.length !== validFiles.length) {
        showNotificationMessage(
          'Only PNG, JPEG, and PDF files are allowed.',
          'warning'
        );
      }

      const newFiles = validFiles.filter(
        (file) =>
          !files.some(
            (f) => f.name === file.name && f.size === file.size && f.lastModified === file.lastModified
          )
      );
      setFiles((prev) => [...prev, ...newFiles]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateFiles = (filesToValidate: File[]): boolean => {
    for (const file of filesToValidate) {
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        return false;
      }
    }
    return true;
  };

  const validateFileSizes = (filesToValidate: File[]): { valid: boolean; message?: string } => {
    for (const file of filesToValidate) {
      if (file.type === 'application/pdf' && file.size > MAX_PDF_SIZE_BYTES) {
        return { valid: false, message: `PDF file "${file.name}" exceeds the 10MB size limit.` };
      }
      if ((file.type === 'image/png' || file.type === 'image/jpeg') && file.size > MAX_IMAGE_SIZE_BYTES) {
        return { valid: false, message: `Image file "${file.name}" exceeds the 5MB size limit.` };
      }
    }
    return { valid: true };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    const title = titleRef.current?.value.trim() || '';
    const message = messageRef.current?.value.trim() || '';

    if (!title) {
      showNotificationMessage('Title is required.', 'error');
      return;
    }
    if (!message) {
      showNotificationMessage('Message is required.', 'error');
      return;
    }

    if (files.length > MAX_FILES_COUNT) {
      showNotificationMessage(`You can upload a maximum of ${MAX_FILES_COUNT} media files.`, 'warning');
      return;
    }
    if (files.length > 0 && !validateFiles(files)) {
      showNotificationMessage(
        'You can only upload these types of media files:\n1. PNG image\n2. JPEG image\n3. PDF document',
        'warning'
      );
      return;
    }

    const sizeValidation = validateFileSizes(files);
    if (!sizeValidation.valid) {
      showNotificationMessage(sizeValidation.message || 'One or more files exceed the size limit.', 'warning');
      return;
    }

    setLoading(true);
    setShowNotification(false);

    try {
      const mediaLinks: string[] = [];
      const mediaPublicIds: string[] = [];
      if (files.length > 0) {
        for (const file of files) {
          if (ALLOWED_MIME_TYPES.includes(file.type)) {
            const { url, publicId } = await uploadFileToCloudinary(file);
            mediaLinks.push(url);
            mediaPublicIds.push(publicId);
          }
        }
      }

      const announcementsCollectionRef = collection(firestore, 'announcements');
      const newAnnouncementRef = doc(announcementsCollectionRef);

      await setDoc(newAnnouncementRef, {
        title,
        message,
        mediaLinks: mediaLinks.length > 0 ? mediaLinks : [],
        mediaPublicIds: mediaPublicIds.length > 0 ? mediaPublicIds : [],
        created_at: serverTimestamp(),
      });
      await fetch('/api/sendNotification', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title, message }),
})


      showNotificationMessage('Announcement Added Successfully!', 'success');
      handleReset();
    } catch (error: any) {
      console.error('Error adding announcement:', error);
      showNotificationMessage('Failed to add announcement. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Media preview for view mode
  const renderMediaPreview = (url: string, idx: number) => {
    const isImage = url.match(/\.(jpeg|jpg|png)$/i);
    const isPdf = url.match(/\.pdf$/i);
    const filename = url.split('/').pop()?.split('?')[0] || `file-${idx + 1}`;
    if (isImage) {
      return (
        <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white">
          <a href={url} download target="_blank" rel="noopener noreferrer" title="Download Image">
            <img src={url} alt="Media Preview" className="w-full h-32 object-cover" />
            <div className="text-xs text-center py-1 truncate">{filename}</div>
          </a>
        </div>
      );
    }
    if (isPdf) {
      return (
        <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center">
          <a href={url} download target="_blank" rel="noopener noreferrer" title="Download PDF" className="flex flex-col items-center py-4">
            <FaFilePdf className="text-5xl text-red-600 mb-2" />
            <div className="text-xs text-center truncate">{filename}</div>
          </a>
        </div>
      );
    }
    // fallback
    return (
      <div key={url} className="w-40 m-2 rounded shadow border border-gray-200 overflow-hidden bg-white flex flex-col items-center justify-center">
        <a href={url} download target="_blank" rel="noopener noreferrer" title="Download File" className="flex flex-col items-center py-4">
          <FaFileAlt className="text-5xl text-gray-600 mb-2" />
          <div className="text-xs text-center truncate">{filename}</div>
        </a>
      </div>
    );
  };

  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddAnnouncementsHeader onBackToBus={onBack} />

      <form onSubmit={handleSubmit} className="space-y-4 p-4 mx-6" noValidate>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-semibold text-[#202020] mb-1">
            Title*
          </label>
          <input
            type="text"
            id="title"
            ref={titleRef}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            required
            disabled={loading || isViewMode}
            placeholder="Enter Announcement Title"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="message" className="block text-sm font-semibold text-[#202020] mb-1">
            Message*
          </label>
          <textarea
            id="message"
            ref={messageRef}
            className={`block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 min-h-[120px] max-h-[300px] resize-none overflow-y-scroll ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            required
            disabled={loading || isViewMode}
            placeholder="Enter your message here"
            style={{ minHeight: '120px', maxHeight: '300px' }}
          />
        </div>

        {/* Only show media upload in add mode */}
        {!isViewMode && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#202020] mb-1">
              Attach Media Files (Optional)
            </label>
            <div className="relative w-full">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                disabled={loading}
                accept=".png, .jpeg, .jpg, .pdf"
                multiple
                id="file-upload"
              />
              <div
                className={`flex items-center bg-[#F5F5F5] rounded-md border border-gray-300 px-3 py-2 w-full cursor-pointer ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={handleFileInputClick}
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleFileInputClick(); }}
                role="button"
                aria-label="Attach media files"
              >
                <button
                  type="button"
                  disabled={loading}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-1 px-4 rounded border border-gray-300 mr-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  tabIndex={-1}
                >
                  Choose files
                </button>
                <span className={`text-gray-700 text-sm truncate ${files.length > 0 ? '' : 'text-gray-400'}`}>
                  {files.length > 0 ? `${files.length} file${files.length > 1 ? 's' : ''} selected` : 'No files chosen'}
                </span>
              </div>
            </div>
       {files.length > 0 && (
              <div className="mt-3 border border-gray-300 rounded-md bg-[#F9FAFB] max-h-48 overflow-auto">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2 border-b border-gray-200 last:border-b-0"
                  >
                    <div className="flex items-center space-x-2 truncate">
                      {getFileIcon(file)}
                      <span className="text-gray-700 text-sm truncate max-w-xs">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      disabled={loading}
                      aria-label={`Remove file ${file.name}`}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media preview for view mode */}
        {isViewMode && mediaLinks.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-semibold text-[#202020] mb-1">
              Attached Media Files
            </label>
            <div className="flex flex-wrap">
              {mediaLinks.map((url, idx) => renderMediaPreview(url, idx))}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end space-x-4">
          {!isViewMode && (
            <>
              <button
                type="button"
                onClick={handleReset}
                disabled={loading}
                className={`bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Add
              </button>
            </>
          )}
        </div>
      </form>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="loader ease-linear rounded-full border-8 border-t-8 border-gray-200 h-16 w-16"></div>
          <style jsx>{`
            .loader {
              border-top-color: #3498db;
              animation: spin 1s linear infinite;
            }
            @keyframes spin {
              0% {
                transform: rotate(0deg);
              }
              100% {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      )}

      {/* Floating Notification */}
      {showNotification && (
        <div
          className={`fixed bottom-4 right-4 z-50 p-6 rounded-lg shadow-lg max-w-xs w-full text-white font-semibold transition-opacity duration-500 ${
            successMessage
              ? 'bg-green-600'
              : warningMessage
              ? 'bg-yellow-600'
              : 'bg-red-600'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex justify-between items-center">
            <div>{successMessage || warningMessage || errorMessage}</div>
            <button
              onClick={() => setShowNotification(false)}
              aria-label="Close notification"
              className="ml-4 font-bold focus:outline-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddAnnouncementsForm;
