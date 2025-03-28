"use client";

import Image from "next/image";
import Sidebar from "./Sidebar/page";
import Dashboard from "./Dashboard/page";

export default function PetDashboard() {
  return (
    <>
      <Sidebar />
      <Dashboard />
    </>
  );
}
