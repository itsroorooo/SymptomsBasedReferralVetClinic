"use client";

import Image from "next/image";
import Sidebar from "../components/Pet_Owners/Sidebar/page";
import Dashboard from "../components/Pet_Owners/Dashboard/page";

export default function PetDashboard() {
  return (
    <>
      <Sidebar />
      <Dashboard />
    </>
  );
}
