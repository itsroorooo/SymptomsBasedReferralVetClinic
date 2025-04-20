"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import PropTypes from 'prop-types';

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

  // Fetch data on mount
  useEffect(() => {
    if (clinicId) {
      fetchScheduleData();
      fetchHolidays();
    }
  }, [clinicId]);

  // Fetch functions
  const fetchScheduleData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/vetclinic/schedules?clinicId=${clinicId}`);
      const data = await response.json();
      if (Array.isArray(data)) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const formattedData = data.map(item => ({
          ...item,
          day_name: days[item.day_of_week],
          opening_time: item.opening_time || "",
          closing_time: item.closing_time || ""
        }));
        setRegularSchedule(formattedData);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async () => {
    try {
      const response = await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`);
      const data = await response.json();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    }
  };

  // Date handlers
  const handleDateSelect = (date) => {
    if (!date) return;
    setSelectedDate(date);
    
    // Check if date is a holiday
    const holiday = holidays.find(h => isSameDay(parseISO(h.holiday_date), date));
    if (holiday) {
      setTempHoliday({ reason: holiday.reason });
    }
    
    // Check if date is a regular day
    const dayOfWeek = date.getDay();
    const schedule = regularSchedule.find(d => d.day_of_week === dayOfWeek);
    if (schedule) {
      setTempSchedule({
        opening_time: schedule.opening_time,
        closing_time: schedule.closing_time,
        is_closed: schedule.is_closed
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
      
      await fetch(`/api/vetclinic/schedules?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schedule: updatedSchedule })
      });
      
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
      
      // Remove if already exists
      const updatedHolidays = holidays.filter(h => !isSameDay(parseISO(h.holiday_date), selectedDate));
      
      // Add new holiday
      updatedHolidays.push({
        holiday_date: holidayDate,
        reason: tempHoliday.reason
      });
      
      await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holidays: updatedHolidays })
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
      const updatedHolidays = holidays.filter(h => !isSameDay(parseISO(h.holiday_date), selectedDate));
      
      await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ holidays: updatedHolidays })
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

      {/* Main Calendar */}
      <div className="bg-white rounded-lg shadow p-6 mb-8 w-full">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Clinic Schedule Calendar</h1>
        
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          modifiers={{
            holiday: holidays.map(h => parseISO(h.holiday_date)),
            closed: regularSchedule
              .filter(day => day.is_closed)
              .flatMap(day => {
                const dates = [];
                const today = new Date();
                const endDate = new Date();
                endDate.setMonth(today.getMonth() + 3);
                for (let d = new Date(today); d <= endDate; d.setDate(d.getDate() + 1)) {
                  if (d.getDay() === day.day_of_week) dates.push(new Date(d));
                }
                return dates;
              })
          }}
          modifiersStyles={{
            holiday: {
              color: '#ef4444',
              backgroundColor: '#fee2e2',
            },
            closed: {
              color: '#9ca3af',
              backgroundColor: '#f3f4f6'
            }
          }}
          className="border-0 mx-auto"
          styles={{
            root: {
              width: "100%", // Adjust the width of the calendar
              maxWidth: "500px", // Set a maximum width
              margin: "0 auto", // Center the calendar
            },
            day: {
              margin: "0.2em", // Adjust spacing between days
              width: "2.5em", // Adjust the width of each day
              height: "2.5em", // Adjust the height of each day
              borderRadius: "0.25em", // Adjust the border radius
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
            <>
              <button
                onClick={openHolidayModal}
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md"
              >
                Edit Holiday
              </button>
              <button
                onClick={handleDeleteHoliday}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md"
                disabled={isLoading}
              >
                Remove Holiday
              </button>
            </>
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
                {regularSchedule[selectedDate.getDay()].opening_time} - 
                {regularSchedule[selectedDate.getDay()].closing_time}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Holidays List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Upcoming Holidays</h2>
        {holidays.length === 0 ? (
          <p className="text-gray-500">No holidays scheduled</p>
        ) : (
          <ul className="divide-y divide-gray-200">
            {holidays
              .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
              .map((holiday) => (
                <li key={holiday.holiday_date} className="py-3 flex justify-between items-center">
                  <div>
                    <span className="font-medium">
                      {format(parseISO(holiday.holiday_date), "MMMM d, yyyy")}
                    </span>
                    <p className="text-sm text-gray-600">{holiday.reason}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
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

ManageSchedule.propTypes = {
  clinicId: PropTypes.string.isRequired
};

export default ManageSchedule;