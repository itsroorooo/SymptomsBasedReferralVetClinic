'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  CalendarIcon,
  BeakerIcon,
  UserCircleIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import SidebarNav from '../../../components/veterinary-clinic/SidebarNav'; // Import SidebarNav
import Header from '../../../components/veterinary-clinic/Header'; // Import Header

export default function ProfileEditPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [profile, setProfile] = useState({
    name: 'John Doe',
    description: 'Software Developer with 5 years of experience in React and Next.js',
    address: '123 Main Street, Anytown, CA 12345',
    schedule: 'Monday-Friday, 9AM-5PM',
    imageUrl: null, // No initial image
  });

  const [previewImage, setPreviewImage] = useState(null);

  // Navigation items
  const navItems = [
    { name: 'Home', href: '/veterinary-clinic/dashboard', icon: HomeIcon, current: false },
    { name: 'Records', href: '/veterinary-clinic/records', icon: ClipboardDocumentListIcon, current: false },
    { name: 'Appointments', href: '/veterinary-clinic/appointments', icon: CalendarIcon, current: false },
    { name: 'Equipment', href: '/veterinary-clinic/equipment', icon: BeakerIcon, current: false },
  ];

  // Simulate fetching profile data
  useEffect(() => {
    // Fetch profile data here (commented out for now)
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile({
      ...profile,
      [name]: value,
    });
    setHasChanges(true); // Mark changes
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setPreviewImage({
        url: imageUrl,
        file: file,
      });
      setHasChanges(true); // Mark changes
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Simulate profile update logic
      let updatedImageUrl = profile.imageUrl;
      if (previewImage?.file) {
        updatedImageUrl = previewImage.url;
      }

      setProfile({
        ...profile,
        imageUrl: updatedImageUrl,
      });

      alert('Profile updated successfully!');
      setHasChanges(false); // Reset changes
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Get initials from the vet clinic name
  const getInitials = (name) => {
    return name
      .split(' ')
      .map((word) => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <SidebarNav sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} navItems={navItems} />

      {/* Main Content Area */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        {/* Header */}
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          title="Profile"
        />

        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Profile Image */}
                <div className="flex flex-col items-center mb-6">
                  <div className="w-32 h-32 mb-4 relative flex items-center justify-center bg-gray-200 rounded-full">
                    {previewImage ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden">
                        <Image
                          src={previewImage.url}
                          alt="Profile preview"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    ) : profile.imageUrl ? (
                      <div className="relative w-32 h-32 rounded-full overflow-hidden">
                        <Image
                          src={profile.imageUrl}
                          alt="Profile"
                          fill
                          className="object-cover"
                          priority
                        />
                      </div>
                    ) : (
                      <span className="text-4xl font-bold text-gray-600">
                        {getInitials(profile.name)}
                      </span>
                    )}
                  </div>
                  <label className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
                    <span>Change Photo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={profile.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={profile.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Address */}
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={profile.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Schedule */}
                <div>
                  <label htmlFor="schedule" className="block text-sm font-medium text-gray-700 mb-1">
                    Schedule
                  </label>
                  <input
                    type="text"
                    id="schedule"
                    name="schedule"
                    value={profile.schedule}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Submit Button */}
                {hasChanges && (
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => router.back()}
                      className="px-6 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-blue-400"
                    >
                      {isLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}