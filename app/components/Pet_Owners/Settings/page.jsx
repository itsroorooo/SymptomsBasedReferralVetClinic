"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import Image from "next/image";
import Link from "next/link";
import Sidebar from "../Sidebar/page";
import { logout } from "@/app/logout/actions";

const SettingsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("preferences");
  const [userProfile, setUserProfile] = useState(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    notifications: true,
    darkMode: false,
  });
  const router = useRouter();
  const supabase = createClient();

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const toggleSidebar = () => {
      setIsSidebarOpen(!isSidebarOpen);
    };
  
    useEffect(() => {
      const verifyAndFetch = async () => {
        try {
          setLoading(true);
  
          const {
            data: { user },
            error: authError,
          } = await supabase.auth.getUser();
          if (authError || !user) {
            router.push("/login");
            return;
          }
  
          const { data: userData, error: roleError } = await supabase
            .from("users")
            .select("role")
            .eq("id", user.id)
            .single();
  
          if (roleError || userData?.role !== "pet_owner") {
            router.push(
              userData?.role === "veterinary" ? "/vetclinic" : "/login"
            );
            return;
          }
  
          const { data: profileData, error: profileError } = await supabase
            .from("pet_owner_profiles")
            .select("first_name, last_name, profile_picture_url")
            .eq("id", user.id)
            .single();
  
          if (profileError) throw profileError;
  
          setUserProfile({
            id: user.id,
            email: user.email,
            first_name: profileData?.first_name || "",
            last_name: profileData?.last_name || "",
            profile_picture_url:
              profileData?.profile_picture_url || "/default-avatar.jpg",
          });
  
          setRoleVerified(true);
        } catch (err) {
          console.error("Error:", err.message);
          router.push("/login");
        } finally {
          setLoading(false);
        }
      };
  
      verifyAndFetch();
    }, [router, supabase]);
  
    useEffect(() => {
      const handleResize = () => {
        if (window.innerWidth >= 768) {
          setIsSidebarOpen(true);
        } else {
          setIsSidebarOpen(false);
        }
      };
  
      window.addEventListener("resize", handleResize);
      handleResize();
  
      return () => window.removeEventListener("resize", handleResize);
    }, []);
  
    if (loading || !roleVerified) {
      return (
        <div className="flex justify-center items-center h-screen bg-gray-100">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Fixed Header */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-bold text-blue-600">Settings</h1>
            
            {/* User Dropdown */}
               {userProfile && (
                            <div className="relative flex items-center space-x-4">
                              <div className="relative">
                                <button
                                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                  className="focus:outline-none"
                                >
                                  <Image
                                    src={userProfile.profile_picture_url}
                                    alt="User profile"
                                    width={48}
                                    height={48}
                                    className="w-12 h-12 rounded-full cursor-pointer"
                                  />
                                </button>
            
                                {isDropdownOpen && (
                                  <div className="absolute right-0 mt-2 bg-white divide-y divide-gray-100 rounded-lg shadow-sm w-44">
                                    <div className="px-4 py-3 text-sm text-gray-900">
                                      <div>{`${userProfile.first_name} ${userProfile.last_name}`}</div>
                                      <div className="font-medium truncate">
                                        {userProfile.email}
                                      </div>
                                    </div>
            
                                    <ul className="py-2 text-sm text-gray-700">
                                      <li>
                                        <button
                                          onClick={() => {
                                            setActiveComponent("profile");
                                            setIsDropdownOpen(false);
                                          }}
                                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                          Profile
                                        </button>
                                      </li>
                                      <li>
                                        <button
                                          onClick={() => {
                                            setActiveComponent("settings");
                                            setIsDropdownOpen(false);
                                          }}
                                          className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                        >
                                          Settings
                                        </button>
                                      </li>
                                    </ul>
            
                                    <div className="py-1">
                                      <form action={logout}>
                                        <button
                                          type="submit"
                                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                        >
                                          Logout
                                        </button>
                                      </form>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                    )}
            </div>
        </header>

        {/* Settings Content */}
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Settings Navigation */}
              <div className="w-full md:w-64 flex-shrink-0">
                <nav className="space-y-1 bg-white p-4 rounded-lg shadow-sm">
                  <button
                    onClick={() => setActiveTab("preferences")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "preferences" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Preferences
                  </button>
                  <button
                    onClick={() => setActiveTab("notifications")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "notifications" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${activeTab === "security" ? "bg-blue-50 text-blue-600" : "text-gray-600 hover:bg-gray-50"}`}
                  >
                    Security
                  </button>
                </nav>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeTab === "preferences" && (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Preferences</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">Dark Mode</h3>
                          <p className="text-sm text-gray-500">Toggle between light and dark theme</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="darkMode"
                            checked={formData.darkMode}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">Language</h3>
                          <p className="text-sm text-gray-500">Interface language</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>English</option>
                          <option>Spanish</option>
                          <option>French</option>
                          <option>German</option>
                        </select>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">Time Zone</h3>
                          <p className="text-sm text-gray-500">Your local time zone</p>
                        </div>
                        <select className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                          <option>(GMT-12:00) International Date Line West</option>
                          <option>(GMT-08:00) Pacific Time (US & Canada)</option>
                          <option>(GMT-05:00) Eastern Time (US & Canada)</option>
                          <option>(GMT+00:00) Greenwich Mean Time</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "notifications" && (
                  <form onSubmit={handleSubmit}>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Notification Preferences</h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-gray-800">Email Notifications</h3>
                          <p className="text-sm text-gray-500">Receive email notifications</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            name="notifications"
                            checked={formData.notifications}
                            onChange={handleInputChange}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-4">Notification Types</h3>
                        
                        <div className="space-y-4">
                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="appointment-reminders"
                                name="appointment-reminders"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="appointment-reminders" className="font-medium text-gray-700">Appointment Reminders</label>
                              <p className="text-gray-500">Get reminders for upcoming appointments</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="health-alerts"
                                name="health-alerts"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="health-alerts" className="font-medium text-gray-700">Health Alerts</label>
                              <p className="text-gray-500">Important health notifications about your pets</p>
                            </div>
                          </div>

                          <div className="flex items-start">
                            <div className="flex items-center h-5">
                              <input
                                id="promotional"
                                name="promotional"
                                type="checkbox"
                                className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                              />
                            </div>
                            <div className="ml-3 text-sm">
                              <label htmlFor="promotional" className="font-medium text-gray-700">Promotional Offers</label>
                              <p className="text-gray-500">Special offers and discounts from our partners</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end mt-8">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 mr-3 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSaving ? 'Saving...' : 'Save Preferences'}
                      </button>
                    </div>
                  </form>
                )}

                {activeTab === "security" && (
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-6">Security Settings</h2>
                    
                    <div className="space-y-6">
                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">Change Password</h3>
                        <p className="text-sm text-gray-500 mb-4">Update your account password</p>
                        <button
                          onClick={() => router.push('/change-password')}
                          className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                        >
                          Change Password
                        </button>
                      </div>

                      <div className="border-b border-gray-200 pb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500 mb-4">Add an extra layer of security to your account</p>
                        <div className="flex items-center">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">Disabled</span>
                          <button
                            onClick={() => router.push('/enable-2fa')}
                            className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            Enable
                          </button>
                        </div>
                      </div>

                      <div className="pb-6">
                        <h3 className="text-sm font-medium text-gray-800 mb-2">Active Sessions</h3>
                        <p className="text-sm text-gray-500 mb-4">Manage your logged-in devices</p>
                        <div className="bg-gray-50 p-4 rounded-md">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">Chrome on Windows</p>
                              <p className="text-xs text-gray-500">Last active: 2 hours ago</p>
                            </div>
                            <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                              Log out
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;