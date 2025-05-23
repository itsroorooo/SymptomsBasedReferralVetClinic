"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { createClient } from "@/utils/supabase/client";

const ManageSchedule = ({ clinicId }) => {
  // State declarations
  const [regularSchedule, setRegularSchedule] = useState([
    { day_of_week: 0, day_name: "Sunday", opening_time: "", closing_time: "", is_closed: true },
    { day_of_week: 1, day_name: "Monday", opening_time: "09:00", closing_time: "17:00", is_closed: false },
    { day_of_week: 2, day_name: "Tuesday", opening_time: "09:00", closing_time: "17:00", is_closed: false },
    { day_of_week: 3, day_name: "Wednesday", opening_time: "09:00", closing_time: "17:00", is_closed: false },
    { day_of_week: 4, day_name: "Thursday", opening_time: "09:00", closing_time: "17:00", is_closed: false },
    { day_of_week: 5, day_name: "Friday", opening_time: "09:00", closing_time: "17:00", is_closed: false },
    { day_of_week: 6, day_name: "Saturday", opening_time: "10:00", closing_time: "15:00", is_closed: false },
  ]);

  const [holidays, setHolidays] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [tempSchedule, setTempSchedule] = useState({
    opening_time: "",
    closing_time: "",
    is_closed: false
  });
  const [tempHoliday, setTempHoliday] = useState({
    reason: ""
  });
  const [appointments, setAppointments] = useState([]);
  const [isFetchingAppointments, setIsFetchingAppointments] = useState(false);
  const supabase = createClient();

  // Fetch data on mount
  useEffect(() => {
    if (clinicId) {
      fetchScheduleData();
      fetchHolidays();
      fetchAppointments(selectedDate);
    }
  }, [clinicId]);

  // Fetch appointments when selected date changes
  useEffect(() => {
    if (clinicId && selectedDate) {
      fetchAppointments(selectedDate);
    }
  }, [selectedDate, clinicId]);

  // Fetch functions
  const fetchScheduleData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('veterinary_schedules')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) throw error;

      if (Array.isArray(data)) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const formattedData = data.map(item => ({
          ...item,
          day_name: days[item.day_of_week],
          opening_time: item.opening_time ? formatTime(item.opening_time) : "",
          closing_time: item.closing_time ? formatTime(item.closing_time) : ""
        }));
        
        const completeSchedule = Array(7).fill().map((_, day_of_week) => {
          const existing = formattedData.find(d => d.day_of_week === day_of_week);
          return existing || {
            day_of_week,
            day_name: days[day_of_week],
            opening_time: "",
            closing_time: "",
            is_closed: true
          };
        });
        
        setRegularSchedule(completeSchedule);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAppointments = async (date) => {
    setIsFetchingAppointments(true);
    setError(null);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          id,
          appointment_date,
          start_time,
          end_time,
          status,
          reason_for_decline,
          pets:pet_id (name, pet_type, breed, age),
          pet_owner_profiles:owner_id (first_name, last_name),
          consultation:consultation_id (additional_info),
          clinic:clinic_id (clinic_name)
        `)
        .eq('clinic_id', clinicId)
        .eq('appointment_date', dateStr)
        .order('start_time', { ascending: true });
  
      if (error) throw error;
  
      // Transform data to match your expected format
      const formattedData = data.map(appointment => ({
        id: appointment.id,
        appointment_date: appointment.appointment_date,
        start_time: appointment.start_time,
        end_time: appointment.end_time,
        status: appointment.status,
        pet_name: appointment.pets?.name || '',
        pet_type: appointment.pets?.pet_type || '',
        breed: appointment.pets?.breed || '',
        age: appointment.pets?.age || null,
        owner_first_name: appointment.pet_owner_profiles?.first_name || '',
        owner_last_name: appointment.pet_owner_profiles?.last_name || '',
        owner_phone: appointment.pet_owner_profiles?.contact_number || '',
        reason: appointment.reason_for_decline || '',
        additional_info: appointment.consultation?.additional_info || '',
        clinic_name: appointment.clinic?.clinic_name || ''
      }));
  
      setAppointments(formattedData);
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setError(err.message || 'Failed to fetch appointments');
      setAppointments([]);
    } finally {
      setIsFetchingAppointments(false);
    }
  };


  const formatTime = (timeString) => {
    if (!timeString) return "";
    const parts = timeString.split(':');
    return `${parts[0]}:${parts[1]}`;
  };

  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('veterinary_holidays')
        .select('*')
        .eq('clinic_id', clinicId);

      if (error) throw error;

      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Date handlers
  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    
    const holiday = holidays.find(h => isSameDay(parseISO(h.holiday_date), date));
    if (holiday) {
      setTempHoliday({ reason: holiday.reason });
    }
    
    const dayOfWeek = date.getDay();
    const schedule = regularSchedule.find(d => d.day_of_week === dayOfWeek) || regularSchedule[dayOfWeek];
    if (schedule) {
      setTempSchedule({
        opening_time: schedule.opening_time || "",
        closing_time: schedule.closing_time || "",
        is_closed: schedule.is_closed || false
      });
    }
  };

  // Modal handlers
  const openScheduleModal = () => {
    setShowScheduleModal(true);
  };

  const openHolidayModal = () => {
    setShowHolidayModal(true);
  };

  const closeModals = () => {
    setShowScheduleModal(false);
    setShowHolidayModal(false);
  };

  // Save handlers
  const handleSaveSchedule = async () => {
    try {
      setIsLoading(true);
      const dayOfWeek = selectedDate.getDay();
      
      const updatedSchedule = [...regularSchedule];
      updatedSchedule[dayOfWeek] = {
        ...updatedSchedule[dayOfWeek],
        opening_time: tempSchedule.is_closed ? "" : tempSchedule.opening_time,
        closing_time: tempSchedule.is_closed ? "" : tempSchedule.closing_time,
        is_closed: tempSchedule.is_closed
      };
      
      // Update in Supabase
      const { error } = await supabase
        .from('veterinary_schedules')
        .upsert({
          clinic_id: clinicId,
          day_of_week: dayOfWeek,
          opening_time: tempSchedule.is_closed ? null : tempSchedule.opening_time,
          closing_time: tempSchedule.is_closed ? null : tempSchedule.closing_time,
          is_closed: tempSchedule.is_closed
        })
        .eq('clinic_id', clinicId)
        .eq('day_of_week', dayOfWeek);

      if (error) throw error;

      setRegularSchedule(updatedSchedule);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      closeModals();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveHoliday = async () => {
    try {
      setIsLoading(true);
      const holidayDate = format(selectedDate, "yyyy-MM-dd");
      
      // Remove existing holiday if it exists
      await supabase
        .from('veterinary_holidays')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('holiday_date', holidayDate);

      // Add new holiday
      const { error } = await supabase
        .from('veterinary_holidays')
        .insert({
          clinic_id: clinicId,
          holiday_date: holidayDate,
          reason: tempHoliday.reason
        });

      if (error) throw error;

      // Update local state
      const updatedHolidays = holidays.filter(h => !isSameDay(parseISO(h.holiday_date), selectedDate));
      updatedHolidays.push({
        holiday_date: holidayDate,
        reason: tempHoliday.reason
      });
      
      setHolidays(updatedHolidays);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      closeModals();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHoliday = async () => {
    try {
      setIsLoading(true);
      const holidayDate = format(selectedDate, "yyyy-MM-dd");
      
      const { error } = await supabase
        .from('veterinary_holidays')
        .delete()
        .eq('clinic_id', clinicId)
        .eq('holiday_date', holidayDate);

      if (error) throw error;

      const updatedHolidays = holidays.filter(h => !isSameDay(parseISO(h.holiday_date), selectedDate));
      setHolidays(updatedHolidays);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      closeModals();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper functions
  const isDateHoliday = (date) => {
    return holidays.some(holiday => isSameDay(parseISO(holiday.holiday_date), date));
  };

  const isDateClosed = (date) => {
    const dayOfWeek = date.getDay();
    const schedule = regularSchedule.find(d => d.day_of_week === dayOfWeek);
    return schedule?.is_closed && !isDateHoliday(date);
  };

  const getDateStatus = (date) => {
    if (isDateHoliday(date)) return "holiday";
    if (isDateClosed(date)) return "closed";
    return "open";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Notifications */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Schedule saved successfully!
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Calendar Section */}
        <div className="bg-white rounded-lg shadow p-6 flex-1">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Clinic Schedule Calendar</h1>
          
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            modifiers={{
              holiday: holidays.map(h => parseISO(h.holiday_date))
            }}
            modifiersStyles={{
              holiday: {
                color: '#ef4444',
                backgroundColor: '#fee2e2',
              }
            }}
            className="border-0 mx-auto"
            styles={{
              root: {
                width: "100%",
                maxWidth: "500px",
                margin: "0 auto",
              },
              day: {
                margin: "0.2em",
                width: "2.5em",
                height: "2.5em",
                borderRadius: "0.25em",
              },
            }}
          />

          {/* Date Actions */}
          <div className="mt-6 flex flex-wrap gap-4">
            <button
              onClick={openScheduleModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
            >
              Set Schedule for {format(selectedDate, 'MMMM d')}
            </button>
            
            {isDateHoliday(selectedDate) ? (
              <button
                onClick={openHolidayModal}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
              >
                Edit Holiday
              </button>
            ) : (
              <button
                onClick={openHolidayModal}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-md"
              >
                Set Holiday
              </button>
            )}
          </div>

          {/* Date Info */}
          <div className="mt-6 bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-3 text-gray-700">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </h3>
            
            {getDateStatus(selectedDate) === "holiday" ? (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                <span className="text-red-600 font-medium">Holiday: </span>
                <span className="ml-2">
                  {holidays.find(h => isSameDay(parseISO(h.holiday_date), selectedDate))?.reason}
                </span>
              </div>
            ) : getDateStatus(selectedDate) === "closed" ? (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-500 rounded-full mr-2"></div>
                <span className="text-gray-600 font-medium">Closed (Regular schedule)</span>
              </div>
            ) : (
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                <span className="text-green-600 font-medium">Open: </span>
                <span className="ml-2">
                  {regularSchedule[selectedDate.getDay()]?.opening_time || '--'} - 
                  {regularSchedule[selectedDate.getDay()]?.closing_time || '--'}
                </span>
              </div>
            )}
          </div>

          {/* Holidays List */}
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Holidays</h2>
            {holidays.length === 0 ? (
              <p className="text-gray-500">No holidays scheduled</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {holidays
                  .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                  .map((holiday) => (
                    <li key={holiday.holiday_date} className="py-3 flex justify-between items-center group">
                      <div>
                        <span className="font-medium">
                          {format(parseISO(holiday.holiday_date), "MMMM d, yyyy")}
                        </span>
                        <p className="text-sm text-gray-600">{holiday.reason}</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedDate(parseISO(holiday.holiday_date));
                          handleDeleteHoliday();
                        }}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete holiday"
                        aria-label="Delete holiday"
                      >
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5" 
                          viewBox="0 0 20 20" 
                          fill="currentColor"
                        >
                          <path 
                            fillRule="evenodd" 
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" 
                            clipRule="evenodd" 
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        {/* Appointment Sticky Note Panel */}
        <div className="lg:sticky lg:top-4 h-fit">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg shadow-lg p-6 w-full lg:w-96 relative">
            {/* Pin decoration */}
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-md">
              <div className="w-4 h-4 bg-red-300 rounded-full"></div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="h-6 w-6 mr-2 text-yellow-600" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
                />
              </svg>
              Appointments for {format(selectedDate, 'MMMM d, yyyy')}
            </h2>
            
            {isFetchingAppointments ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400"></div>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-6">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="h-12 w-12 mx-auto text-gray-400" 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={1} 
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
                  />
                </svg>
                <p className="mt-2 text-gray-500">No appointments scheduled</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {appointments.map((appointment) => (
                  <div 
                    key={appointment.id} 
                    className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 hover:border-yellow-300 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-800">
                          {appointment.pet_name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {appointment.pet_type} ({appointment.breed})
                        </p>
                      </div>
                      <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded">
                        {format(new Date(`1970-01-01T${appointment.start_time}`), 'h:mm a')}
                      </span>
                    </div>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Owner:</span> {appointment.owner_first_name} {appointment.owner_last_name}
                      </p>
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Reason:</span> {appointment.reason}
                      </p>
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Status:</span> 
                        <span className={`ml-1 px-2 py-0.5 rounded text-xs ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-yellow-200">
              <p className="text-sm text-gray-600">
                <span className="font-medium">Total appointments:</span> {appointments.length}
              </p>
              {getDateStatus(selectedDate) === "holiday" && (
                <p className="text-sm text-red-500 mt-1">
                  Note: This day is marked as a holiday. No regular appointments should be scheduled.
                </p>
              )}
              {getDateStatus(selectedDate) === "closed" && (
                <p className="text-sm text-gray-500 mt-1">
                  Note: Clinic is normally closed on this day.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                Set Schedule for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={!tempSchedule.is_closed}
                    onChange={() => setTempSchedule({
                      ...tempSchedule,
                      is_closed: !tempSchedule.is_closed
                    })}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium">Clinic is open</span>
                </label>
              </div>
              
              {!tempSchedule.is_closed && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                    <input
                      type="time"
                      value={tempSchedule.opening_time}
                      onChange={(e) => setTempSchedule({
                        ...tempSchedule,
                        opening_time: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                    <input
                      type="time"
                      value={tempSchedule.closing_time}
                      onChange={(e) => setTempSchedule({
                        ...tempSchedule,
                        closing_time: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      required
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t p-4 flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSchedule}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-70"
              >
                {isLoading ? "Saving..." : "Save Schedule"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="border-b p-4">
              <h2 className="text-xl font-bold text-gray-800">
                {isDateHoliday(selectedDate) ? "Edit Holiday" : "Set Holiday"} for {format(selectedDate, 'MMMM d, yyyy')}
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={tempHoliday.reason}
                  onChange={(e) => setTempHoliday({
                    ...tempHoliday,
                    reason: e.target.value
                  })}
                  placeholder="E.g., Christmas Day"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            
            <div className="border-t p-4 flex justify-end gap-2">
              <button
                onClick={closeModals}
                className="px-4 py-2 border border-gray-300 rounded-md"
              >
                Cancel
              </button>
              {isDateHoliday(selectedDate) && (
                <button
                  onClick={handleDeleteHoliday}
                  disabled={isLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-70"
                >
                  {isLoading ? "Deleting..." : "Delete Holiday"}
                </button>
              )}
              <button
                onClick={handleSaveHoliday}
                disabled={isLoading || !tempHoliday.reason}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-70"
              >
                {isLoading ? "Saving..." : "Save Holiday"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageSchedule;