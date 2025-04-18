import React from 'react';

type NameFeePaidRowProps = {
  name: string;
  setName: React.Dispatch<React.SetStateAction<string>>;
  feePaid: string;
  disabled: boolean;
};

const NameFeePaidRow: React.FC<NameFeePaidRowProps> = ({ name, setName, feePaid, disabled }) => {
  const normalizeSpaces = (str: string) => str.replace(/^\s+/, '').replace(/\s+/g, ' ');

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^[A-Za-z\s]*$/.test(val)) {
      setName(normalizeSpaces(val));
    }
  };

  const handleNameBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setName(normalizeSpaces(e.target.value.trim()));
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <label htmlFor="name" className="block text-sm font-semibold text-[#202020]">
          Name *
        </label>
        <input
          type="text"
          id="name"
          maxLength={50}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
          value={name}
          onChange={handleNameChange}
          onBlur={handleNameBlur}
          required
          disabled={disabled}
        />
      </div>
      <div>
        <label htmlFor="feePaid" className="block text-sm font-semibold text-[#202020]">
          Fee Paid *
        </label>
        <select
          id="feePaid"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
          value={feePaid}
          disabled
        >
          <option>Yes</option>
        </select>
      </div>
    </div>
  );
};

export default NameFeePaidRow;
