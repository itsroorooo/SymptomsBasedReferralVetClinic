"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import {
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
} from "@heroicons/react/24/outline";

export default function HomePage() {
  const supabase = createClient();
  const [appointmentsToday, setAppointmentsToday] = useState(0);
  const [pendingRecords, setPendingRecords] = useState(0);
  const [equipmentNeedingAttention, setEquipmentNeedingAttention] = useState(0);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Get today's date in the correct format
      const today = new Date().toISOString().split('T')[0];
      
      // Fetch today's appointments
      const { count: todayAppointmentsCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today)
        .neq('status', 'cancelled')
        .neq('status', 'declined');

      // Fetch pending records (consultations)
      const { count: pendingConsultationsCount } = await supabase
        .from('pet_consultations')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch equipment needing attention
      const { count: equipmentAttentionCount } = await supabase
        .from('clinic_equipment')
        .select('*', { count: 'exact', head: true })
        .eq('is_available', false);

      // Fetch recent completed appointments (for activity feed)
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select(`
          id,
          pet_id,
          pets!inner(name, pet_type),
          start_time,
          status,
          created_at
        `)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      setAppointmentsToday(todayAppointmentsCount || 0);
      setPendingRecords(pendingConsultationsCount || 0);
      setEquipmentNeedingAttention(equipmentAttentionCount || 0);
      
      // Format recent activities
      const activities = recentAppointments?.map(appt => ({
        id: appt.id,
        pet_name: appt.pets?.name,
        pet_type: appt.pets?.pet_type,
        status: appt.status,
        created_at: appt.created_at
      })) || [];
      
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <main className="flex-1 overflow-y-auto bg-gray-50">
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-4">
            {/* Dashboard content */}
            {loading ? (
              <div className="flex justify-center items-center min-h-screen">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
            ) : (
              <>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Stats Card - Appointments Today */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <CalendarIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Appointments Today
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {appointmentsToday}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Card - Pending Records */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <ClipboardDocumentListIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Pending Records
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {pendingRecords}
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Stats Card - Equipment Status */}
                  <div className="bg-white overflow-hidden shadow rounded-lg">
                    <div className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BeakerIcon className="h-6 w-6 text-gray-400" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-gray-500 truncate">
                              Equipment Status
                            </dt>
                            <dd>
                              <div className="text-lg font-medium text-gray-900">
                                {equipmentNeedingAttention} Need Attention
                              </div>
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="mt-8">
                  <h2 className="text-lg leading-6 font-medium text-gray-900">
                    Recent Activity
                  </h2>
                  <div className="mt-2 bg-white shadow overflow-hidden sm:rounded-md">
                    <ul className="divide-y divide-gray-200">
                      {recentActivities.map((activity) => (
                        <li key={activity.id}>
                          <a href="#" className="block hover:bg-gray-50">
                            <div className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-indigo-600 truncate">
                                  {activity.pet_type} Visit
                                </p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                    {activity.status}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    {activity.pet_name} ({activity.pet_type})
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>
                                    {formatDate(activity.created_at)} at {formatTime(activity.created_at)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}