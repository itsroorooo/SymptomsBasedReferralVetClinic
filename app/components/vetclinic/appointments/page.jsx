"use client";

import { useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { toast } from 'react-hot-toast';

const RealTimeAppointmentAlerts = ({ clinicId }) => {
  const [newAppointments, setNewAppointments] = useState([]);

  useEffect(() => {
    if (!clinicId) return;

    // Initial fetch of pending appointments
    const fetchPendingAppointments = async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          pet: pets (name, photo_url, pet_type),
          owner: owner_id (email, profile: pet_owner_profiles (first_name, last_name)),
          appointment_date,
          start_time,
          reason
        `)
        .eq('clinic_id', clinicId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setNewAppointments(data);
      }
    };

    fetchPendingAppointments();

    // Set up real-time subscription
    const subscription = supabase
      .channel('appointment_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `clinic_id=eq.${clinicId}`
        },
        (payload) => {
          // When new appointment is added
          if (payload.new.status === 'pending') {
            setNewAppointments(prev => [payload.new, ...prev]);
            
            // Fetch full appointment details
            supabase
              .from('appointments')
              .select(`
                id,
                pet: pets (name, photo_url, pet_type),
                owner: owner_id (email, profile: pet_owner_profiles (first_name, last_name)),
                appointment_date,
                start_time,
                reason
              `)
              .eq('id', payload.new.id)
              .single()
              .then(({ data }) => {
                if (data) {
                  toast.custom((t) => (
                    <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} 
                      w-full max-w-md bg-white rounded-lg shadow-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}>
                      <div className="flex-1 p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0 pt-0.5">
                            {data.pet?.photo_url ? (
                              <img
                                className="h-10 w-10 rounded-full"
                                src={data.pet.photo_url}
                                alt={data.pet.name}
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500">
                                  {data.pet?.name?.charAt(0).toUpperCase() || 'P'}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="ml-3 flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              New Appointment Request
                            </p>
                            <p className="mt-1 text-sm text-gray-500">
                              <span className="font-semibold">{data.pet?.name}</span> ({data.pet?.pet_type}) 
                              by {data.owner?.profile?.first_name} {data.owner?.profile?.last_name}
                            </p>
                            <p className="mt-1 text-xs text-gray-500">
                              {new Date(data.appointment_date).toLocaleDateString()} at {data.start_time}
                            </p>
                            <div className="mt-2 flex space-x-2">
                              <button
                                onClick={() => handleAppointmentAction(data.id, 'confirmed')}
                                className="text-xs bg-green-500 text-white px-2 py-1 rounded"
                              >
                                Accept
                              </button>
                              <button
                                onClick={() => handleAppointmentAction(data.id, 'declined')}
                                className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                              >
                                Decline
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ), { duration: 10000 });
                }
              });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [clinicId]);

  const handleAppointmentAction = async (appointmentId, action) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: action, updated_at: new Date().toISOString() })
      .eq('id', appointmentId);

    if (!error) {
      setNewAppointments(prev => prev.filter(app => app.id !== appointmentId));
      
      // Create notification for pet owner
      const appointment = newAppointments.find(app => app.id === appointmentId);
      if (appointment) {
        await supabase.from('notifications').insert({
          user_id: appointment.owner_id,
          title: `Appointment ${action}`,
          message: `Your appointment for ${appointment.pet.name} has been ${action}.`,
          related_entity_type: 'appointment',
          related_entity_id: appointmentId
        });
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">New Appointment Requests</h3>
      
      {newAppointments.length === 0 ? (
        <p className="text-gray-500">No pending appointments</p>
      ) : (
        <div className="space-y-2">
          {newAppointments.map(appointment => (
            <div key={appointment.id} className="border rounded-lg p-4 flex items-start">
              <div className="flex-shrink-0 mr-3">
                {appointment.pet?.photo_url ? (
                  <img
                    className="h-12 w-12 rounded-full"
                    src={appointment.pet.photo_url}
                    alt={appointment.pet.name}
                  />
                ) : (
                  <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">
                      {appointment.pet?.name?.charAt(0).toUpperCase() || 'P'}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <div className="flex justify-between">
                  <h4 className="font-medium">
                    {appointment.pet?.name} ({appointment.pet?.pet_type})
                  </h4>
                  <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                    Pending
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Owner: {appointment.owner?.profile?.first_name} {appointment.owner?.profile?.last_name}
                </p>
                <p className="text-sm text-gray-600">
                  {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.start_time}
                </p>
                {appointment.reason && (
                  <p className="text-sm mt-1">
                    <span className="font-medium">Reason:</span> {appointment.reason}
                  </p>
                )}
                <div className="mt-2 flex space-x-2">
                  <button
                    onClick={() => handleAppointmentAction(appointment.id, 'confirmed')}
                    className="text-sm bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => handleAppointmentAction(appointment.id, 'declined')}
                    className="text-sm bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Decline
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RealTimeAppointmentAlerts;