"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AddRouteHeader from "./AddRouteHeader";
import { firestore } from "@/lib/firebase";
import { collection, addDoc, Timestamp, query, getDocs, orderBy, limit, where, doc, updateDoc } from "firebase/firestore";

type AddRouteFormProps = {
  onBack: () => void;
};

const AddSessionForm: React.FC<AddRouteFormProps> = ({ onBack }) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  return (
    <div className="bg-white w-full min-h-screen relative">
      <div className="rounded-lg mb-2">
        <AddRouteHeader onBackToRoutes={onBack} />
      </div>
     
    </div>
  );
};

export default AddSessionForm;
