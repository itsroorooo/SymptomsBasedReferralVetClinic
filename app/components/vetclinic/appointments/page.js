"use client";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";
import SidebarNav from "../../../components/veterinary-clinic/SidebarNav";
import Header from "../../../components/veterinary-clinic/Header";

const StaffAppointmentsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);

  // Navigation items
  const navItems = [
    { name: "Home", href: "/veterinary-clinic/dashboard", icon: HomeIcon, current: false },
    { name: "Records", href: "/veterinary-clinic/records", icon: ClipboardDocumentListIcon, current: false },
    { name: "Appointments", href: "/veterinary-clinic/appointments", icon: CalendarIcon, current: true },
    { name: "Equipment", href: "/veterinary-clinic/equipment", icon: BeakerIcon, current: false },
  ];

  // Fetch appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const response = await axios.get("/api/veterinary-clinic/appointments");
        setAppointments(response.data);
      } catch (error) {
        console.error("Error fetching appointments:", error);
      }
    };
    fetchAppointments();
  }, []);

  // Handle accept appointment
  const handleAccept = async (id) => {
    try {
      await axios.put(`/api/veterinary-clinic/appointments/${id}`, {
        status: "accepted",
      });
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "accepted" } : app))
      );
    } catch (error) {
      console.error("Error accepting appointment:", error);
    }
  };

  // Handle decline appointment
  const handleDecline = async (id) => {
    try {
      await axios.put(`/api/veterinary-clinic/appointments/${id}`, {
        status: "declined",
      });
      setAppointments((prev) =>
        prev.map((app) => (app.id === id ? { ...app, status: "declined" } : app))
      );
    } catch (error) {
      console.error("Error declining appointment:", error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar Navigation */}
      <SidebarNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} navItems={navItems} />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} title="Manage Appointments" />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Appointments List */}
              <div className="space-y-4">
                {appointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="bg-white p-4 rounded-lg shadow-md"
                  >
                    <p className="font-medium">{appointment.petName}</p>
                    <p className="text-sm text-gray-600">{appointment.ownerName}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(appointment.date).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600">
                      Status: {appointment.status}
                    </p>
                    {appointment.status === "pending" && (
                      <div className="flex space-x-2 mt-2">
                        <button
                          onClick={() => handleAccept(appointment.id)}
                          className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => handleDecline(appointment.id)}
                          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                        >
                          Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default StaffAppointmentsPage;