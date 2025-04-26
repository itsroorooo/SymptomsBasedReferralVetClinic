"use client";

import { useState, useEffect } from 'react';
import { createClient } from "@/utils/supabase/client";
import Head from 'next/head';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';

const ClinicAppointmentsPage = () => {
  const [user, setUser] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState({
    page: true,
    appointments: true
  });
  const [error, setError] = useState(null);
  const [expandedAppointment, setExpandedAppointment] = useState(null);
  const [tabValue, setTabValue] = useState('pending');
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const supabase = createClient();

  const fetchUserAndData = async () => {
    try {
      setLoading(prev => ({ ...prev, page: true, appointments: true }));
      setError(null);

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      setUser(user);
      if (!user) {
        setLoading({ page: false, appointments: false });
        return;
      }

      // Check if user is associated with a clinic
      const { data: clinicData, error: clinicError } = await supabase
        .from('users')
        .select('clinic_id')
        .eq('id', user.id)
        .single();

      if (clinicError) throw clinicError;
      if (!clinicData || !clinicData.clinic_id) {
        throw new Error('User is not associated with any clinic');
      }

      await fetchAppointments(clinicData.clinic_id);
    } catch (err) {
      console.error('Error:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(prev => ({ ...prev, page: false }));
    }
  };

  const fetchAppointments = async (clinicId) => {
    try {
      setLoading(prev => ({ ...prev, appointments: true }));
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          reason_for_decline,
          created_at,
          is_ai_booking,
          pet:pet_id (
            id,
            name,
            pet_type,
            breed,
            age,
            photo_url
          ),
          owner:owner_id (
            id,
            email,
            pet_owner_profile:pet_owner_profiles (
              first_name,
              last_name,
              contact_number
            )
          ),
          consultation:consultation_id (
            id,
            additional_info,
            status,
            consultation_symptoms (
              symptom:symptom_id (
                id,
                name
              )
            ),
            ai_diagnoses (
              id,
              possible_condition,
              created_at
            )
          )
        `)
        .eq('clinic_id', clinicId)
        .order('appointment_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setAppointments(data || []);
    } catch (err) {
      console.error('Error fetching appointments:', {
        message: err.message,
        details: err.details,
        code: err.code
      });
      setError('Failed to load appointments');
    } finally {
      setLoading(prev => ({ ...prev, appointments: false }));
    }
  };

  const handleUpdateAppointmentStatus = async (appointmentId, status, reason = null) => {
    setIsProcessing(true);
    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString(),
        ...(status === 'declined' && { reason_for_decline: reason || 'Declined by clinic' })
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', appointmentId);

      if (error) throw error;

      // Create notification for pet owner
      const appointment = appointments.find(a => a.id === appointmentId);
      if (appointment?.owner?.id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: appointment.owner.id,
            title: `Appointment ${status}`,
            message: `Your appointment for ${appointment.pet?.name || 'your pet'} on ${formatDate(appointment.appointment_date)} has been ${status}. ${reason ? `Reason: ${reason}` : ''}`,
            related_entity_type: 'appointment',
            related_entity_id: appointmentId
          });
      }

      // Refresh appointments
      await fetchAppointments(user.clinic_id);
      toast.success(`Appointment ${status} successfully`);
    } catch (err) {
      console.error('Error updating appointment:', {
        message: err.message,
        details: err.details,
        code: err.code
      });
      toast.error(`Failed to update appointment: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setDeclineDialogOpen(false);
      setDeclineReason('');
    }
  };

  const handleOpenDeclineDialog = (appointment) => {
    setSelectedAppointment(appointment);
    setDeclineDialogOpen(true);
  };

  const handleAccordionChange = (appointmentId) => {
    setExpandedAppointment(expandedAppointment === appointmentId ? null : appointmentId);
  };

  const handleTabChange = (newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString) => {
    return new Date(`1970-01-01T${timeString}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'declined':
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter appointments by status
  const filteredAppointments = appointments.filter(appt => 
    tabValue === 'all' ? true : appt.status === tabValue
  );

  useEffect(() => {
    fetchUserAndData();
  }, []);

  if (loading.page) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">
                Error: {error}
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={fetchUserAndData}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h3 className="text-xl font-semibold text-gray-700">Please sign in to view appointments</h3>
      </div>
    );
  }

  return (
    <>
      <Head>
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </Head>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 font-['Poppins']">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div className="mt-4 md:mt-0">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 overflow-x-auto">
              <button
                onClick={() => handleTabChange('all')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabValue === 'all' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                All Appointments
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tabValue === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {appointments.length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('pending')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabValue === 'pending' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Pending
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tabValue === 'pending' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {appointments.filter(a => a.status === 'pending').length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('confirmed')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabValue === 'confirmed' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Confirmed
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tabValue === 'confirmed' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {appointments.filter(a => a.status === 'confirmed').length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('declined')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabValue === 'declined' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Declined
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tabValue === 'declined' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {appointments.filter(a => a.status === 'declined').length}
                </span>
              </button>
              <button
                onClick={() => handleTabChange('completed')}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${tabValue === 'completed' ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
              >
                Completed
                <span className={`ml-2 py-0.5 px-2 rounded-full text-xs font-medium ${tabValue === 'completed' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}`}>
                  {appointments.filter(a => a.status === 'completed').length}
                </span>
              </button>
            </nav>
          </div>
        </div>
        
        {loading.appointments ? (
          <div className="flex justify-center items-center min-h-[200px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-6 text-center bg-white rounded-lg shadow">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No {tabValue === 'all' ? '' : tabValue} appointments found</h3>
            <p className="mt-1 text-gray-500">When you have {tabValue === 'all' ? '' : tabValue} appointments, they'll appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                <div 
                  className={`p-4 cursor-pointer transition-all duration-200 ${expandedAppointment === appointment.id ? 'bg-gray-50' : 'hover:bg-gray-50'}`}
                  onClick={() => handleAccordionChange(appointment.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${appointment.is_ai_booking ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                        {appointment.is_ai_booking ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          {appointment.pet?.name || 'Unknown Pet'} ({appointment.pet?.pet_type || 'Unknown'})
                        </h3>
                        <div className="text-sm text-gray-500">
                          <p>{formatDate(appointment.appointment_date)} • {formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                          <p>Owner: {appointment.owner?.pet_owner_profile?.first_name || 'Unknown'} {appointment.owner?.pet_owner_profile?.last_name || ''}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                        {appointment.status}
                      </span>
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`h-5 w-5 text-gray-400 transform transition-transform duration-200 ${expandedAppointment === appointment.id ? 'rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {expandedAppointment === appointment.id && (
                  <div className="px-4 pb-4">
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        Pet Information
                      </h4>
                      <div className="flex items-start space-x-4">
                        {appointment.pet?.photo_url ? (
                          <img 
                            src={appointment.pet.photo_url} 
                            alt={appointment.pet.name} 
                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p className="text-sm text-gray-500">Name</p>
                            <p className="font-medium">{appointment.pet?.name || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Type</p>
                            <p className="font-medium">{appointment.pet?.pet_type || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Breed</p>
                            <p className="font-medium">{appointment.pet?.breed || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Age</p>
                            <p className="font-medium">{appointment.pet?.age || 'Unknown'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 my-4"></div>
                    
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Owner Information
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Name</p>
                          <p className="font-medium">
                            {appointment.owner?.pet_owner_profile?.first_name || 'Unknown'} {appointment.owner?.pet_owner_profile?.last_name || ''}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{appointment.owner?.email || 'Unknown'}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Contact Number</p>
                          <p className="font-medium">{appointment.owner?.pet_owner_profile?.contact_number || 'Unknown'}</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 my-4"></div>
                    
                    <div className="mb-6">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Appointment Details
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Date</p>
                          <p className="font-medium">{formatDate(appointment.appointment_date)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Time</p>
                          <p className="font-medium">{formatTime(appointment.start_time)} - {formatTime(appointment.end_time)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                            {appointment.status}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Booked on</p>
                          <p className="font-medium">{new Date(appointment.created_at).toLocaleString()}</p>
                        </div>
                        {appointment.reason_for_decline && (
                          <div className="md:col-span-2">
                            <p className="text-sm text-gray-500">Decline Reason</p>
                            <p className="font-medium">{appointment.reason_for_decline}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {appointment.consultation && (
                      <>
                        <div className="border-t border-gray-200 my-4"></div>
                        
                        <div className="mb-6">
                          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            Consultation Details
                          </h4>
                          
                          <div className="mb-4">
                            <p className="text-sm text-gray-500">Additional Information</p>
                            <p className="font-medium">{appointment.consultation.additional_info || 'None provided'}</p>
                          </div>
                          
                          {appointment.consultation.consultation_symptoms?.length > 0 && (
                            <div className="mb-4">
                              <p className="text-sm text-gray-500 mb-2">Reported Symptoms</p>
                              <div className="flex flex-wrap gap-2">
                                {appointment.consultation.consultation_symptoms.map((symptomItem) => (
                                  <span 
                                    key={symptomItem.symptom?.id || Math.random()}
                                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800"
                                  >
                                    {symptomItem.symptom?.name || 'Unknown symptom'}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {appointment.is_ai_booking && appointment.consultation.ai_diagnoses?.length > 0 && (
                            <div>
                              <p className="text-sm text-gray-500 mb-2">AI-Generated Possible Diagnoses</p>
                              <div className="space-y-3">
                                {appointment.consultation.ai_diagnoses.map((diagnosis) => (
                                  <div key={diagnosis.id} className="bg-gray-50 p-3 rounded-lg">
                                    <p className="font-medium">
                                      {typeof diagnosis.possible_condition === 'object' 
                                        ? diagnosis.possible_condition.diagnosis || 'Unknown diagnosis'
                                        : diagnosis.possible_condition || 'Unknown diagnosis'}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                      Generated on {new Date(diagnosis.created_at).toLocaleString()}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    
                    {appointment.status === 'pending' && (
          <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end space-x-3">
            <button
              onClick={() => handleOpenDeclineDialog(appointment)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Decline'}
            </button>
            <button
              onClick={() => handleUpdateAppointmentStatus(appointment.id, 'confirmed')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Appointment'}
            </button>
          </div>
        )}

        {/* Decline Reason Dialog */}
        <Dialog open={declineDialogOpen} onClose={() => !isProcessing && setDeclineDialogOpen(false)}>
          <DialogTitle>Decline Appointment</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Reason for declining"
              type="text"
              fullWidth
              variant="outlined"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              multiline
              rows={4}
              disabled={isProcessing}
            />
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setDeclineDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={async () => {
                if (!declineReason.trim()) {
                  toast.error('Please provide a reason for declining');
                  return;
                }
                await handleUpdateAppointmentStatus(selectedAppointment.id, 'declined', declineReason);
              }}
              color="error"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Confirm Decline'}
            </Button>
          </DialogActions>
        </Dialog>
                    
                    {appointment.status === 'confirmed' && (
                      <div className="border-t border-gray-200 pt-4 mt-4 flex justify-end space-x-3">
                        <button
                          onClick={() => handleUpdateAppointmentStatus(appointment.id, 'completed')}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                        >
                          Mark as Completed
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default ClinicAppointmentsPage;