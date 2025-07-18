import React, { useState, useRef } from 'react';
import { FaIdCard } from 'react-icons/fa';

type BusCardRowProps = {
  busCard: string;
  setBusCard: React.Dispatch<React.SetStateAction<string>>;
  busCardStatus: string;
  setBusCardStatus: React.Dispatch<React.SetStateAction<string>>;
  disabled: boolean;
  statusDisabled?: boolean; // New optional prop to disable status input
};

const BusCardRow: React.FC<BusCardRowProps> = ({
  busCard,
  setBusCard,
  busCardStatus,
  setBusCardStatus,
  disabled,
  statusDisabled = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [scannedCard, setScannedCard] = useState('');
  const [isScanSuccessful, setIsScanSuccessful] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  const openModal = () => {
    setIsModalOpen(true);
    setMessage('Tap bus card on RFID reader!');
    setScannedCard('');
    setIsScanSuccessful(false);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');

    if (value.length > 10) value = value.slice(0, 10);

    setScannedCard(value);

    if (value.length === 10) {
      if (/^\d{10}$/.test(value)) {
        setMessage('Success! Bus card scanned.');
        setIsScanSuccessful(true);
        setBusCard(value);
        setTimeout(() => {
          closeModal();
        }, 1000);
      } else {
        setMessage('Invalid format. Only digits allowed!');
        setIsScanSuccessful(false);
      }
    } else if (value.length > 0) {
      setMessage('Waiting for full card scan...');
      setIsScanSuccessful(false);
    } else {
      setMessage('Tap bus card on RFID reader!');
      setIsScanSuccessful(false);
    }
  };

  // Masked value for display
  const maskedBusCard = busCard ? '*'.repeat(busCard.length) : '';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="busCard" className="block text-sm font-semibold text-[#202020]">
          Bus Card
        </label>
        <input
          type="text"
          id="busCard"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 cursor-pointer"
          placeholder="Tap here..."
          value={maskedBusCard}
          onFocus={openModal}
          readOnly
          required={false} // Optional field
          disabled={disabled}
        />
      </div>

      <div>
        <label htmlFor="busCardStatus" className="block text-sm font-semibold text-[#202020]">
          Bus Card Status *
        </label>
        <select
          id="busCardStatus"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
          value={busCardStatus}
          onChange={(e) => setBusCardStatus(e.target.value)}
          required
          disabled={disabled || statusDisabled}
        >
          <option>Active</option>
          <option>Inactive</option>
        </select>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <button
              type="button"
              onClick={closeModal}
              aria-label="Close"
              className="absolute top-2 right-3 text-2xl text-gray-400 hover:text-gray-700"
              tabIndex={0}
            >
              &times;
            </button>
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Scan Bus Card
            </h3>
            <div className="mt-2 px-7 py-3 text-center">
              <FaIdCard className="mx-auto h-16 w-16 text-blue-500 animate-pulse mb-4" />
              <p
                className={`text-sm ${
                  isScanSuccessful
                    ? 'text-green-500'
                    : message.startsWith('Tap')
                    ? 'text-gray-600'
                    : 'text-red-500'
                }`}
              >
                {message}
              </p>
              <input
                ref={inputRef}
                type="text"
                inputMode="numeric"
                pattern="\d*"
                autoFocus
                value={scannedCard}
                onChange={handleInputChange}
                className="absolute left-[-9999px]"
                tabIndex={-1}
                id="rfid-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusCardRow;
