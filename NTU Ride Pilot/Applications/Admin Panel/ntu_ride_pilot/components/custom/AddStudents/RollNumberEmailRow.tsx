import React from 'react';

type RollNumberEmailRowProps = {
  rollNumber: string;
  setRollNumber: React.Dispatch<React.SetStateAction<string>>;
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  disabled: boolean;
};

const RollNumberEmailRow: React.FC<RollNumberEmailRowProps> = ({
  rollNumber,
  setRollNumber,
  email,
  setEmail,
  disabled,
}) => {
  const normalizeSpaces = (str: string) => str.replace(/^\s+/, '').replace(/\s+/g, ' ');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="rollNumber" className="block text-sm font-semibold text-[#202020] mb-1">
          Roll Number *
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            maxLength={2}
            pattern="\d{2}"
            title="Enter 2 digits"
            className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
            value={rollNumber.split('-')[0] || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 2);
              const parts = rollNumber.split('-');
              parts[0] = val;
              setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
            }}
            required
            disabled={disabled}
          />

          <span className="text-2xl font-bold">-NTU-</span>

          <input
            type="text"
            maxLength={2}
            pattern="[A-Za-z]{2}"
            title="Enter 2 letters"
            className="w-12 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3 uppercase"
            value={rollNumber.split('-')[2] || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/[^A-Za-z]/g, '').toUpperCase().slice(0, 2);
              const parts = rollNumber.split('-');
              parts[2] = val;
              setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
            }}
            required
            disabled={disabled}
          />

          <span className="text-2xl font-bold">-</span>

          <input
            type="text"
            maxLength={4}
            pattern="\d{4}"
            title="Enter 4 digits"
            className="w-16 text-center rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
            value={rollNumber.split('-')[3] || ''}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 4);
              const parts = rollNumber.split('-');
              parts[3] = val;
              setRollNumber(`${parts[0] || ''}-NTU-${parts[2] || ''}-${parts[3] || ''}`);
            }}
            required
            disabled={disabled}
          />
        </div>
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-semibold text-[#202020]">
          Email *
        </label>
        <input
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
          value={email}
          onChange={(e) => setEmail(normalizeSpaces(e.target.value))}
          onBlur={(e) => setEmail(normalizeSpaces(e.target.value.trim()))}
          required
          disabled={disabled}
        />
      </div>
    </div>
  );
};

export default RollNumberEmailRow;
