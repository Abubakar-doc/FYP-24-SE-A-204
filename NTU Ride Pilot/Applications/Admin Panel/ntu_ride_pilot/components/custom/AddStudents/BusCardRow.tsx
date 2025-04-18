import React from 'react';

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="busCard" className="block text-sm font-semibold text-[#202020]">
          Bus Card
        </label>
        <input
          type="text"
          id="busCard"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
          placeholder="Tap here..."
          value={busCard}
          onChange={(e) => setBusCard(e.target.value)}
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
          <option>Yes</option>
          <option>No</option>
        </select>
      </div>
    </div>
  );
};

export default BusCardRow;
