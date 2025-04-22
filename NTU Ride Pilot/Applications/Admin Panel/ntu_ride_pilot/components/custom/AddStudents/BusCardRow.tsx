import React, { useState, useEffect } from 'react';

type BusCardRowProps = {
  busCard: string;
  setBusCard: React.Dispatch<React.SetStateAction<string>>;
  busCardStatus: string;
  setBusCardStatus: React.Dispatch<React.SetStateAction<string>>;
  disabled: boolean;
};

const BusCardRow: React.FC<BusCardRowProps> = ({
  busCard,
  setBusCard,
  busCardStatus,
  setBusCardStatus,
  disabled,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false); // Simulate RFID reading process
  const [cardRead, setCardRead] = useState(false);  // Track whether a card has been read

  const openModal = () => {
    setIsModalOpen(true);
    setMessage('');        // Clear any previous message
    setScanning(true);    // Start "scanning"
    setCardRead(false);   // Reset card read status
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setScanning(false);    // Stop "scanning" when closing modal
  };

  const validateCard = (cardNumber: string) => {
    if (cardNumber.length < 10) {
      setMessage('Bus Card not Reads Successfully Please Scan the Bus card again!');
      return false;
    }

    if (cardNumber.length > 10) {
      setMessage('Bus Card already Reads Successfully!');
      return false;
    }

    if (!/^\d+$/.test(cardNumber)) {
      setMessage('Invalid Bus Card Number Format (Only Digits are allowed)!');
      return false;
    }

    return true;
  };

  // Simulate RFID reading process
  useEffect(() => {
    if (scanning && !cardRead) { // Only "scan" if we're in the modal, scanning, and haven't read a card yet
      const simulateRFIDRead = () => {
        const randomNumber = Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

        if (validateCard(randomNumber)) {
          setBusCard(randomNumber);
          setMessage('Bus Card Reads Successfully!');
          setCardRead(true);    // Card has been successfully read
          setScanning(false); // Disable scanning after reading
        }
      };

      const timer = setTimeout(() => {
        simulateRFIDRead();
        setScanning(false);
      }, 2000);   // Simulate 2 seconds to read card

      return () => clearTimeout(timer);  // Clear timer if component unmounts or scanning stops
    }
  }, [scanning, setBusCard, cardRead]);

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
          value={busCard}
          onFocus={openModal}
          readOnly
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
          disabled={disabled}
        >
          <option>Active</option>
          <option>InActive</option>
        </select>
      </div>

      {/* Bus Card Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Tap bus card on RFID reader!</h3>
            <div className="mt-2 px-7 py-3">
              {/* Display message */}
              {message && <p className={`text-center ${message === 'Bus Card Reads Successfully!' ? 'text-green-500' : 'text-red-500'}`}>{message}</p>}

              {/* Replace with RFID reader icon or animation */}
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </div>
            <div className="items-center px-4 py-3">
              <button
                className="px-4 py-2 bg-gray-500 text-white text-base font-medium rounded-md width-full shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-300"
                onClick={closeModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusCardRow;
