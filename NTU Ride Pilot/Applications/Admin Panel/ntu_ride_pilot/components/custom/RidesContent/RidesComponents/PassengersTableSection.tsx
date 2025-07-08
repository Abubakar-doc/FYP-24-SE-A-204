"use client";
import React, { useState, useMemo } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

type Passenger = {
  id: number;
  name: string;
  rollNo: string;
};

type PassengersTableSectionProps = {
  passengers: {
    name: string;
    roll_no: string;
  }[];
};

const PassengersTableSection: React.FC<PassengersTableSectionProps> = ({
  passengers,
}) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const mappedPassengers: Passenger[] = useMemo(
    () =>
      passengers.map((p, index) => ({
        id: index + 1,
        name: p.name,
        rollNo: p.roll_no,
      })),
    [passengers]
  );

  const filtered = useMemo(
    () =>
      mappedPassengers.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.rollNo.toLowerCase().includes(search.toLowerCase())
      ),
    [search, mappedPassengers]
  );

  const perPage = 3;
  const paginated = filtered.slice(page * perPage, page * perPage + perPage);

  const maxPage = Math.max(0, Math.ceil(filtered.length / perPage) - 1);

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mt-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-semibold">Passengers Onboard</h2>
        <input
          type="text"
          placeholder="Search"
          className="w-[520px] px-4 py-2 border rounded-md focus:outline-none focus:ring focus:border-blue-300"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(0);
          }}
        />
      </div>
      <div className="rounded-lg border border-gray-300 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-300 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[10%] border-b border-gray-300">
                ID
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[45%] border-b border-gray-300">
                Name
              </th>
              <th className="px-2 py-2 text-center text-xs font-medium text-gray-600 uppercase tracking-wider w-[45%] border-b border-gray-300">
                Roll No.
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-300 text-center">
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-4 text-center text-gray-500">
                  No passengers found.
                </td>
              </tr>
            ) : (
              paginated.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="py-2 px-4 whitespace-nowrap w-[10%]">{p.id}</td>
                  <td className="py-2 px-4 whitespace-nowrap w-[45%]">{p.name}</td>
                  <td className="py-2 px-4 whitespace-nowrap w-[45%]">{p.rollNo}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end items-center mt-2 gap-2">
        <button
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={() => setPage((p) => Math.max(0, p - 1))}
          disabled={page === 0}
        >
          <FaChevronLeft />
        </button>
        <span className="text-gray-600 text-xs">
          Page {page + 1} of {maxPage + 1}
        </span>
        <button
          className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
          onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
          disabled={page === maxPage}
        >
          <FaChevronRight />
        </button>
      </div>
    </div>
  );
};

export default PassengersTableSection;