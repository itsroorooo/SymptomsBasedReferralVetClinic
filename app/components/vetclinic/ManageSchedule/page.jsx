"use client";

import React, { useState, useEffect } from 'react';
import { format, parseISO, isSameDay } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { createClient } from "@/utils/supabase/client";
import toast from 'react-hot-toast';

const ScheduleManagement = ({ clinicId }) => {
  // State for regular schedule
  const [regularSchedule, setRegularSchedule] = useState([
    { day_of_week: 0, day_name: 'Sunday', opening_time: '', closing_time: '', is_closed: true },
    { day_of_week: 1, day_name: 'Monday', opening_time: '09:00', closing_time: '17:00', is_closed: false },
    { day_of_week: 2, day_name: 'Tuesday', opening_time: '09:00', closing_time: '17:00', is_closed: false },
    { day_of_week: 3, day_name: 'Wednesday', opening_time: '09:00', closing_time: '17:00', is_closed: false },
    { day_of_week: 4, day_name: 'Thursday', opening_time: '09:00', closing_time: '17:00', is_closed: false },
    { day_of_week: 5, day_name: 'Friday', opening_time: '09:00', closing_time: '17:00', is_closed: false },
    { day_of_week: 6, day_name: 'Saturday', opening_time: '10:00', closing_time: '15:00', is_closed: false },
  ]);
  const supabase = createClient();
  
  // State for holidays
  const [holidays, setHolidays] = useState([]);
  const [newHoliday, setNewHoliday] = useState({
    holiday_date: '',
    reason: ''
  });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Fetch data on component mount
  useEffect(() => {
    fetchScheduleData();
    fetchHolidays();
  }, [clinicId]);

  // Fetch regular schedule from database
  const fetchScheduleData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('veterinary_schedules')
        .select('*')
        .eq('clinic_id', clinicId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setRegularSchedule(data);
      } else {
        // Initialize default schedule if no data exists
        const defaultSchedule = [...regularSchedule].map(day => ({
          ...day,
          clinic_id: clinicId
        }));
        
        const { error: insertError } = await supabase
          .from('veterinary_schedules')
          .insert(defaultSchedule);

        if (insertError) throw insertError;
      }
    } catch (error) {
      toast.error('Error loading schedule: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch holidays from database
  const fetchHolidays = async () => {
    try {
      const { data, error } = await supabase
        .from('veterinary_holidays')
        .select('*')
        .eq('clinic_id', clinicId)
        .gte('holiday_date', new Date().toISOString())
        .order('holiday_date', { ascending: true });

      if (error) throw error;
      setHolidays(data || []);
    } catch (error) {
      toast.error('Error loading holidays: ' + error.message);
    }
  };

  // Handle changes to regular schedule
  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...regularSchedule];
    
    if (field === 'is_closed') {
      updatedSchedule[index][field] = !updatedSchedule[index][field];
      // Clear times when closed
      if (updatedSchedule[index][field]) {
        updatedSchedule[index].opening_time = '';
        updatedSchedule[index].closing_time = '';
      }
    } else {
      updatedSchedule[index][field] = value;
    }
    
    setRegularSchedule(updatedSchedule);
  };

  // Save schedule to database
  const handleSaveSchedule = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('veterinary_schedules')
        .upsert(
          regularSchedule.map(day => ({
            ...day,
            clinic_id: clinicId,
            opening_time: day.is_closed ? null : day.opening_time,
            closing_time: day.is_closed ? null : day.closing_time
          }))
        );

      if (error) throw error;
      toast.success('Schedule saved successfully!');
    } catch (error) {
      toast.error('Error saving schedule: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Add new holiday
  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    
    if (!newHoliday.holiday_date || !newHoliday.reason) {
      toast.error('Please select a date and provide a reason');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('veterinary_holidays')
        .insert([{
          clinic_id: clinicId,
          holiday_date: newHoliday.holiday_date,
          reason: newHoliday.reason
        }]);

      if (error) throw error;
      
      toast.success('Holiday added successfully!');
      setNewHoliday({ holiday_date: '', reason: '' });
      fetchHolidays();
    } catch (error) {
      toast.error('Error adding holiday: ' + error.message);
    }
  };

  // Delete holiday
  const handleDeleteHoliday = async (id) => {
    try {
      const { error } = await supabase
        .from('veterinary_holidays')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Holiday removed successfully!');
      setHolidays(holidays.filter(holiday => holiday.id !== id));
    } catch (error) {
      toast.error('Error removing holiday: ' + error.message);
    }
  };

  // Check if date is already a holiday
  const isDateDisabled = (date) => {
    return holidays.some(holiday => 
      isSameDay(parseISO(holiday.holiday_date), date)
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Clinic Schedule Management
          </h1>
          <p className="mt-3 text-xl text-gray-500">
            Manage your veterinary clinic's regular hours and holidays
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Regular Schedule Section */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Regular Weekly Schedule
              </h2>
              
              <div className="space-y-4">
                {regularSchedule.map((day, index) => (
                  <div key={day.day_of_week} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!day.is_closed}
                          onChange={() => handleScheduleChange(index, 'is_closed')}
                          className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <span className="ml-2 font-medium text-gray-700">{day.day_name}</span>
                      </label>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${day.is_closed ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {day.is_closed ? 'Closed' : 'Open'}
                      </span>
                    </div>
                    
                    {!day.is_closed && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                          <input
                            type="time"
                            value={day.opening_time}
                            onChange={(e) => handleScheduleChange(index, 'opening_time', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                          <input
                            type="time"
                            value={day.closing_time}
                            onChange={(e) => handleScheduleChange(index, 'closing_time', e.target.value)}
                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleSaveSchedule}
                  disabled={isLoading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </>
                  ) : 'Save Schedule'}
                </button>
              </div>
            </div>
          </div>

          {/* Holidays Section */}
          <div className="bg-white shadow-xl rounded-lg overflow-hidden">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                <svg className="w-6 h-6 mr-2 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                Holidays & Special Closures
              </h2>
              
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Add New Holiday</h3>
                <form onSubmit={handleHolidaySubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <div className="border border-gray-300 rounded-lg p-2">
                      <DayPicker
                        mode="single"
                        selected={selectedDate}
                        onSelect={(day) => {
                          setSelectedDate(day);
                          setNewHoliday({
                            ...newHoliday,
                            holiday_date: format(day, 'yyyy-MM-dd')
                          });
                        }}
                        disabled={isDateDisabled}
                        fromYear={new Date().getFullYear()}
                        toYear={new Date().getFullYear() + 2}
                        modifiers={{
                          disabled: isDateDisabled
                        }}
                        styles={{
                          day: {
                            borderRadius: '0.25rem',
                            margin: '0.1rem'
                          },
                          day_disabled: {
                            color: '#e53e3e',
                            textDecoration: 'line-through'
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                    <input
                      type="text"
                      value={newHoliday.reason}
                      onChange={(e) => setNewHoliday({...newHoliday, reason: e.target.value})}
                      placeholder="E.g., Christmas Day, Staff Training"
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    />
                  </div>
                  
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Add Holiday
                  </button>
                </form>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Upcoming Holidays</h3>
                {holidays.length === 0 ? (
                  <div className="text-center py-6">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500">No holidays scheduled</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {holidays.map(holiday => (
                      <li key={holiday.id} className="py-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">
                              {format(parseISO(holiday.holiday_date), 'MMMM d, yyyy')}
                            </p>
                            <p className="text-sm text-gray-500">{holiday.reason}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteHoliday(holiday.id)}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                          >
                            Remove
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManagement;