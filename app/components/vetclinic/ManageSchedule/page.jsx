"use client";

import React, { useState, useEffect } from "react";
import { format, parseISO, isSameDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import PropTypes from 'prop-types';

const ManageSchedule = ({ clinicId }) => {
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
  const [newHoliday, setNewHoliday] = useState({ holiday_date: "", reason: "" });
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log("Clinic ID:", clinicId);
    if (clinicId) {
      fetchScheduleData();
      fetchHolidays();
    }
  }, [clinicId]);

    ManageSchedule.propTypes = {
      clinicId: PropTypes.string.isRequired
    };

  const fetchScheduleData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/vetclinic/schedules?clinicId=${clinicId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch schedule");
      }
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        // Map the data to include day_name for display
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
      console.error("Error fetching schedule:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHolidays = async () => {
    setError(null);
    try {
      const response = await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch holidays");
      }
      const data = await response.json();
      setHolidays(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching holidays:", err);
      setError(err.message);
    }
  };

  const handleScheduleChange = (index, field, value) => {
    const updatedSchedule = [...regularSchedule];
    if (field === "is_closed") {
      updatedSchedule[index][field] = !updatedSchedule[index][field];
      if (updatedSchedule[index][field]) {
        updatedSchedule[index].opening_time = "";
        updatedSchedule[index].closing_time = "";
      }
    } else {
      updatedSchedule[index][field] = value;
    }
    setRegularSchedule(updatedSchedule);
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    
    if (!newHoliday.holiday_date || !newHoliday.reason) {
      setError("Please fill all fields");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (holidays.some(h => h.holiday_date === newHoliday.holiday_date)) {
        throw new Error("This date is already marked as a holiday");
      }
  
      const response = await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId, // Add this
          holidays: [
            ...holidays,
            {
              holiday_date: newHoliday.holiday_date,
              reason: newHoliday.reason,
            }
          ]
        }),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add holiday");
      }
  
      await fetchHolidays();
      setNewHoliday({ holiday_date: "", reason: "" });
      setSelectedDate(new Date());
    } catch (err) {
        console.error("Holiday submission error:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

  const handleDeleteHoliday = async (holidayId) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          holidays: holidays.filter(h => h.id !== holidayId)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete holiday");
      }
      
      await fetchHolidays();
    } catch (err) {
      console.error("Error deleting holiday:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSchedule = async () => {
    if (!clinicId) {
      setError("Clinic ID is missing");
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
  
      // Save regular schedule
      const scheduleResponse = await fetch(`/api/vetclinic/schedules?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clinicId, // Add this
          schedule: regularSchedule.map(item => ({
            day_of_week: item.day_of_week,
            opening_time: item.is_closed ? null : item.opening_time,
            closing_time: item.is_closed ? null : item.closing_time,
            is_closed: item.is_closed
          }))
        }),
      });
  
      // Save holidays
      const holidaysResponse = await fetch(`/api/vetclinic/holidays?clinicId=${clinicId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          clinicId, // Add this
          holidays 
        }),
      });
  
      if (!holidaysResponse.ok) {
        const errorData = await holidaysResponse.json();
        throw new Error(errorData.error || "Failed to save holidays");
      }
  
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
        console.error("Error saving schedule:", err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

  const isDateDisabled = (date) => {
    return holidays.some((holiday) => 
      isSameDay(parseISO(holiday.holiday_date), date)
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
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
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Regular Schedule Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Regular Weekly Schedule</h2>
          <div className="space-y-4">
            {regularSchedule.map((day, index) => (
              <div key={day.day_of_week} className="border-b pb-4 last:border-b-0">
                <div className="flex items-center justify-between mb-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={!day.is_closed}
                      onChange={() => handleScheduleChange(index, "is_closed")}
                      className="mr-2 h-4 w-4 text-blue-600"
                    />
                    <span className="font-medium">{day.day_name}</span>
                  </label>
                  {day.is_closed ? (
                    <span className="text-red-500">Closed</span>
                  ) : (
                    <span className="text-green-600">Open</span>
                  )}
                </div>
                {!day.is_closed && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                      <input
                        type="time"
                        value={day.opening_time}
                        onChange={(e) => handleScheduleChange(index, "opening_time", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                      <input
                        type="time"
                        value={day.closing_time}
                        onChange={(e) => handleScheduleChange(index, "closing_time", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Holidays Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Holidays & Special Closures</h2>
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Add New Holiday</h3>
            <form onSubmit={handleHolidaySubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <DayPicker
                  mode="single"
                  selected={selectedDate}
                  onSelect={(day) => {
                    if (!day) return;
                    setSelectedDate(day);
                    setNewHoliday({
                      ...newHoliday,
                      holiday_date: format(day, "yyyy-MM-dd"),
                    });
                  }}
                  disabled={isDateDisabled}
                  fromYear={new Date().getFullYear()}
                  toYear={new Date().getFullYear() + 2}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <input
                  type="text"
                  value={newHoliday.reason}
                  onChange={(e) => setNewHoliday({ ...newHoliday, reason: e.target.value })}
                  placeholder="E.g., Christmas Day"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Adding..." : "Add Holiday"}
              </button>
            </form>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-3">Upcoming Holidays</h3>
            {holidays.length === 0 ? (
              <p className="text-gray-500">No holidays scheduled</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {holidays
                  .sort((a, b) => new Date(a.holiday_date) - new Date(b.holiday_date))
                  .map((holiday) => (
                    <li key={holiday.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-medium">
                          {format(parseISO(holiday.holiday_date), "MMMM d, yyyy")}
                        </span>
                        <p className="text-sm text-gray-600">{holiday.reason}</p>
                      </div>
                      <button
                        onClick={() => handleDeleteHoliday(holiday.id)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                        disabled={isLoading}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleSaveSchedule}
          disabled={isLoading}
          className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Saving..." : "Save All Changes"}
        </button>
      </div>
    </div>
  );
};

export default ManageSchedule;