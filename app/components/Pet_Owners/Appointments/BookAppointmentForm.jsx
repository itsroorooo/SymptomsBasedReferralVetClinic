'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Icon } from '@iconify/react'
import { createClient } from 'utils/supabase/client'

const BookAppointmentForm = ({ clinic = {}, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    petId: '',
    date: '',
    time: '',
    ownerName: ''
  })
  const [pets, setPets] = useState([])
  const [availableTimes, setAvailableTimes] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState({
    pets: true,
    times: false,
    submitting: false,
    session: true
  })
  const [errors, setErrors] = useState({})
  const [sessionChecked, setSessionChecked] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  // Calculate end time (30 minutes after start)
  const calculateEndTime = (startTime) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endTime = new Date(1970, 0, 1, hours, minutes + 30)
    return endTime.toTimeString().substring(0, 5)
  }

  // Check if date is a holiday
  const isHoliday = useCallback(
    (date) => {
      return holidays.some(
        (holiday) =>
          new Date(holiday.holiday_date).toDateString() ===
          new Date(date).toDateString()
      )
    },
    [holidays]
  )

  // Verify session and fetch initial data
  const verifySessionAndFetchData = useCallback(async () => {
    setLoading(prev => ({ ...prev, session: true }))
    try {
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error || !session) {
        router.push('/login')
        return
      }

      setSessionChecked(true)
      await fetchPets(session.user.id)
      if (clinic.id) await fetchHolidays()
    } catch (error) {
      console.error('Session verification failed:', error)
      setErrors(prev => ({ ...prev, session: 'Authentication check failed' }))
    } finally {
      setLoading(prev => ({ ...prev, session: false }))
    }
  }, [supabase, router, clinic.id])

  // Fetch user's pets
  const fetchPets = useCallback(async (userId) => {
    setLoading(prev => ({ ...prev, pets: true }))
    try {
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('owner_id', userId)

      if (petsError) throw petsError

      setPets(petsData || [])
    } catch (error) {
      console.error('Error fetching pets:', error)
      setErrors(prev => ({ ...prev, pets: 'Failed to load pets' }))
    } finally {
      setLoading(prev => ({ ...prev, pets: false }))
    }
  }, [supabase])

  // Fetch clinic holidays
  const fetchHolidays = useCallback(async () => {
    try {
      const { data: holidaysData, error: holidaysError } = await supabase
        .from('veterinary_holidays')
        .select('*')
        .eq('clinic_id', clinic.id)

      if (holidaysError) throw holidaysError

      setHolidays(holidaysData || [])
    } catch (error) {
      console.error('Error fetching holidays:', error)
    }
  }, [clinic.id, supabase])

  // Fetch available appointment times
  const fetchAvailableTimes = useCallback(async () => {
    if (!formData.date || !clinic.id) return

    setLoading(prev => ({ ...prev, times: true }))
    setAvailableTimes([])

    if (isHoliday(formData.date)) {
      setLoading(prev => ({ ...prev, times: false }))
      return
    }

    const dayOfWeek = new Date(formData.date).getDay()

    try {
      // Get clinic schedule
      const { data: schedule, error: scheduleError } = await supabase
        .from('veterinary_schedules')
        .select('*')
        .eq('clinic_id', clinic.id)
        .eq('day_of_week', dayOfWeek)
        .single()

      if (scheduleError) throw scheduleError

      if (!schedule || schedule.is_closed) {
        setLoading(prev => ({ ...prev, times: false }))
        return
      }

      // Get existing appointments
      const { data: appointments, error: appointmentsError } = await supabase
        .from('appointments')
        .select('start_time')
        .eq('clinic_id', clinic.id)
        .eq('appointment_date', formData.date)
        .in('status', ['pending', 'confirmed'])

      if (appointmentsError) throw appointmentsError

      // Generate available time slots
      const bookedTimes = appointments?.map((a) => a.start_time) || []
      const times = []
      const opening = new Date(`1970-01-01T${schedule.opening_time}`)
      const closing = new Date(`1970-01-01T${schedule.closing_time}`)
      let currentTime = new Date(opening)

      while (currentTime < closing) {
        const timeString = currentTime.toTimeString().substring(0, 5)
        if (!bookedTimes.includes(timeString)) {
          times.push(timeString)
        }
        currentTime = new Date(currentTime.getTime() + 30 * 60000)
      }

      setAvailableTimes(times)
    } catch (error) {
      console.error('Error fetching available times:', error)
      setErrors(prev => ({ ...prev, times: 'Failed to load available times' }))
    } finally {
      setLoading(prev => ({ ...prev, times: false }))
    }
  }, [formData.date, clinic.id, isHoliday, supabase])

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    
    if (name === 'date') {
      setFormData(prev => ({ ...prev, time: '' }))
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }))
    }
  }

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const newErrors = {}
    if (!formData.petId) newErrors.petId = 'Please select a pet'
    if (!formData.ownerName) newErrors.ownerName = 'Please enter your name'
    if (!formData.date) newErrors.date = 'Please select a date'
    if (!formData.time) newErrors.time = 'Please select a time'
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
  
    setLoading(prev => ({ ...prev, submitting: true }))
  
    try {
      // 1. Verify session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError || !session) {
        throw new Error('User not authenticated - please login again')
      }
  
      // 2. Prepare consultation data
      const consultationData = {
        pet_id: formData.petId,
        owner_id: session.user.id,
        status: 'pending',
        pet_type: selectedPet?.pet_type || 'other'
      }
  
      console.log('Attempting to create consultation with:', consultationData)
  
      // 3. Create consultation with enhanced error handling
      const { data: consultation, error: consultError } = await supabase
        .from('pet_consultations')
        .insert(consultationData)
        .select()
        .single()
  
      if (consultError) {
        console.error('Detailed consultation error:', {
          message: consultError.message,
          code: consultError.code,
          details: consultError.details,
          hint: consultError.hint
        })
        throw new Error(`Failed to create consultation: ${consultError.message}`)
      }
  
      if (!consultation) {
        throw new Error('No consultation data returned from database')
      }
  
      console.log('Created consultation:', consultation)
  
      // 4. Prepare appointment data
      const appointmentData = {
        consultation_id: consultation.id,
        clinic_id: clinic.id,
        pet_id: formData.petId,
        owner_id: session.user.id,
        appointment_date: formData.date,
        start_time: formData.time,
        end_time: calculateEndTime(formData.time),
        status: 'pending'
      }
  
      console.log('Attempting to create appointment with:', appointmentData)
  
      // 5. Create appointment
      const { error: appointmentError } = await supabase
        .from('appointments')
        .insert(appointmentData)
  
      if (appointmentError) {
        console.error('Detailed appointment error:', {
          message: appointmentError.message,
          code: appointmentError.code,
          details: appointmentError.details,
          hint: appointmentError.hint
        })
        
        // Rollback consultation if appointment fails
        await supabase
          .from('pet_consultations')
          .delete()
          .eq('id', consultation.id)
  
        throw new Error(`Failed to create appointment: ${appointmentError.message}`)
      }
  
      onSuccess()
      onClose()
    } catch (error) {
      console.error('Full error stack:', error)
      setErrors({
        form: error.message || 'An unknown error occurred during booking',
        details: error.details || error.code || ''
      })
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }))
    }
  }

  // Initial data fetch
  useEffect(() => {
    verifySessionAndFetchData()
  }, [verifySessionAndFetchData])

  // Fetch times when date changes
  useEffect(() => {
    if (formData.date) {
      fetchAvailableTimes()
    }
  }, [formData.date, fetchAvailableTimes])

  // Get selected pet details
  const selectedPet = pets.find(p => p.id === formData.petId)

  if (loading.session) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon icon="mdi:loading" className="animate-spin text-2xl text-blue-500" />
        <span className="ml-2">Checking authentication...</span>
      </div>
    )
  }

  if (!sessionChecked) {
    return null
  }

  return (
    <div className="bg-white rounded-2xl overflow-hidden w-full max-w-md animate-pop-in shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-5 text-white relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-blue-200 transition-colors"
          aria-label="Close booking form"
        >
          <Icon icon="mdi:close" className="text-2xl" />
        </button>
        <div className="flex items-center space-x-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Icon icon="mdi:paw" className="text-2xl" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Book Appointment</h3>
            <p className="text-sm opacity-90">{clinic.clinic_name || 'Veterinary Clinic'}</p>
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {errors.form && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg border border-red-200">
            {errors.form}
          </div>
        )}

        {/* Owner Information */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:account" className="mr-2 text-blue-500" />
            Pet Owner/Guardian Name
          </label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            placeholder="Enter your full name"
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white text-gray-700 ${
              errors.ownerName ? 'border-red-300' : 'border-blue-200'
            }`}
            disabled={loading.submitting}
          />
          {errors.ownerName && (
            <p className="mt-1 text-sm text-red-600">{errors.ownerName}</p>
          )}
        </div>

        {/* Pet Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:paw-outline" className="mr-2 text-blue-500" />
            Select Pet
          </label>
          {loading.pets ? (
            <div className="p-3 bg-blue-50 rounded-lg text-center">
              <Icon icon="mdi:loading" className="animate-spin text-xl text-blue-500" />
            </div>
          ) : pets.length > 0 ? (
            <select
              name="petId"
              value={formData.petId}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white text-gray-700 ${
                errors.petId ? 'border-red-300' : 'border-blue-200'
              }`}
              disabled={loading.submitting}
            >
              <option value="">Choose your pet</option>
              {pets.map(pet => (
                <option key={pet.id} value={pet.id}>
                  {pet.name} ({pet.pet_type})
                </option>
              ))}
            </select>
          ) : (
            <div className="text-center py-4 bg-blue-50 rounded-lg border border-blue-100">
              <p className="text-blue-700">No pets registered</p>
              <button
                onClick={() => router.push('/user/pets/new')}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center justify-center mx-auto"
              >
                <Icon icon="mdi:plus" className="mr-1" />
                Add a pet first
              </button>
            </div>
          )}
          {errors.petId && (
            <p className="mt-1 text-sm text-red-600">{errors.petId}</p>
          )}
        </div>

        {/* Selected Pet Details */}
        {selectedPet && (
          <div className="mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
            <div className="flex items-center space-x-2 text-blue-800 mb-2">
              <Icon icon="mdi:paw" className="text-lg" />
              <h4 className="font-semibold">Selected Pet Details</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm text-blue-700">
              <div>
                <span className="font-medium">Name:</span> {selectedPet.name}
              </div>
              <div>
                <span className="font-medium">Type:</span> {selectedPet.pet_type}
              </div>
              <div>
                <span className="font-medium">Breed:</span> {selectedPet.breed || 'Not specified'}
              </div>
              <div>
                <span className="font-medium">Age:</span> {selectedPet.age || 'Unknown'}
              </div>
            </div>
          </div>
        )}

        {/* Date Picker */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
            <Icon icon="mdi:calendar" className="mr-2 text-blue-500" />
            Appointment Date
          </label>
          <input
            type="date"
            name="date"
            min={new Date().toISOString().split('T')[0]}
            value={formData.date}
            onChange={handleChange}
            className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-300 focus:border-blue-400 bg-white text-gray-700 ${
              errors.date ? 'border-red-300' : 'border-blue-200'
            }`}
            disabled={loading.submitting || loading.times}
          />
          {errors.date && (
            <p className="mt-1 text-sm text-red-600">{errors.date}</p>
          )}
        </div>

        {/* Time Slot Selection */}
        {formData.date && (
          <div className="mb-4">
            <div className="flex items-center text-gray-700 mb-2">
              <Icon icon="mdi:clock-outline" className="mr-2 text-blue-500" />
              <span className="font-medium">{formatDate(formData.date)}</span>
            </div>
            
            {isHoliday(formData.date) ? (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 text-center">
                <p>The clinic is closed on this day (holiday)</p>
              </div>
            ) : loading.times ? (
              <div className="p-3 bg-blue-50 rounded-lg text-center border border-blue-100">
                <Icon icon="mdi:loading" className="animate-spin text-xl text-blue-500" />
                <p className="mt-2 text-blue-700">Loading available times...</p>
              </div>
            ) : availableTimes.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {availableTimes.map(time => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, time }))}
                    className={`p-2 rounded-lg border text-sm transition-colors ${
                      formData.time === time
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white border-blue-200 hover:bg-blue-50 text-blue-700'
                    }`}
                    disabled={loading.submitting}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-100 text-center">
                <p>No available times for this date</p>
                <p className="text-sm mt-1">The clinic may be closed or fully booked</p>
              </div>
            )}
            {errors.time && !formData.time && (
              <p className="mt-1 text-sm text-red-600">{errors.time}</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-blue-50 px-5 py-4 flex justify-end border-t border-blue-100">
        <button
          onClick={onClose}
          className="px-4 py-2 border border-blue-300 rounded-lg mr-2 hover:bg-blue-100 text-blue-700 transition-colors"
          disabled={loading.submitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={
            !formData.petId || 
            !formData.date || 
            !formData.time || 
            !formData.ownerName || 
            loading.submitting || 
            loading.times
          }
          className={`px-4 py-2 rounded-lg flex items-center transition-colors ${
            (!formData.petId || !formData.date || !formData.time || !formData.ownerName || loading.submitting || loading.times)
                ? 'bg-blue-300 cursor-not-allowed text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {loading.submitting ? (
            <>
              <Icon icon="mdi:loading" className="animate-spin mr-2" />
              Booking...
            </>
          ) : (
            <>
              <Icon icon="mdi:calendar-check" className="mr-2" />
              Confirm Appointment
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default BookAppointmentForm