'use client';
import React, { useEffect, useRef, useState } from 'react';
import AddBusHeader from './AddBusHeader';
import { useSearchParams } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import {
  doc,
  setDoc,
  getDocs,
  collection,
  serverTimestamp,
  getDoc,
  updateDoc,
  arrayUnion,
} from 'firebase/firestore';

type AddBusFormProps = {
  onBack: () => void;
};



const AddBusForm: React.FC<AddBusFormProps> = ({ onBack }) => {
  

  


  return (
    <div className="bg-white w-full min-h-screen relative">
      <AddBusHeader onBackToBus={onBack} />

      <form  className="space-y-4 p-4 mx-6">
       
        <div>
          <label htmlFor="regNo" className="block text-sm font-semibold text-[#202020]">
            Registration No *
          </label>
          <input
            type="text"
            id="regNo"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-[#F5F5F5] p-3"
            required
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-700 font-bold py-2 px-10 rounded focus:outline-none focus:shadow-outline"
            >
            Reset
          </button>
          <button
            type="submit"
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-16 rounded focus:outline-none focus:shadow-outline'
            >
            Add
          </button>
        </div>
      </form>

      
    </div>
  );
};

export default AddBusForm;
