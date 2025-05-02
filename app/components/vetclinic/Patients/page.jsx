"use client";

import { useEffect, useState } from "react";
import { fetchPetPatients } from "./actions";
import Image from "next/image";
import {
  FaDog,
  FaCat,
  FaDove,
  FaWeight,
  FaPalette,
  FaUser,
  FaCalendarAlt,
  FaVenusMars,
  FaNotesMedical,
} from "react-icons/fa";

// Common pet breeds by type
const PET_BREEDS = {
  dog: [
    "Labrador Retriever",
    "German Shepherd",
    "Golden Retriever",
    "Bulldog",
    "Beagle",
    "Poodle",
    "Rottweiler",
    "Yorkshire Terrier",
    "Boxer",
    "Dachshund",
  ],
  cat: [
    "Persian",
    "Maine Coon",
    "Siamese",
    "Ragdoll",
    "Bengal",
    "Abyssinian",
    "Scottish Fold",
    "Sphynx",
    "British Shorthair",
    "Russian Blue",
  ],
  bird: [
    "Parakeet",
    "Cockatiel",
    "Lovebird",
    "Canary",
    "Finch",
    "African Grey",
    "Macaw",
    "Cockatoo",
    "Amazon Parrot",
    "Conure",
  ],
};

const getPetTypeIcon = (type) => {
  switch (type?.toLowerCase()) {
    case "dog":
      return <FaDog className="text-amber-600" />;
    case "cat":
      return <FaCat className="text-gray-600" />;
    case "bird":
      return <FaDove className="text-blue-500" />;
    default:
      return <FaDog className="text-gray-400" />;
  }
};

export default function PetPatientsPage() {
  const [pets, setPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [breedFilter, setBreedFilter] = useState("");
  const [selectedPetType, setSelectedPetType] = useState("all");
  const [selectedBreed, setSelectedBreed] = useState("all");

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        const petData = await fetchPetPatients();
        setPets(petData);
        setFilteredPets(petData);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [retryCount]);

  useEffect(() => {
    let filtered = [...pets];

    if (selectedPetType !== "all") {
      filtered = filtered.filter(
        (pet) => pet.pet_type?.toLowerCase() === selectedPetType.toLowerCase()
      );
    }

    if (selectedBreed !== "all") {
      filtered = filtered.filter(
        (pet) => pet.breed?.toLowerCase() === selectedBreed.toLowerCase()
      );
    }

    if (breedFilter) {
      filtered = filtered.filter((pet) =>
        pet.breed?.toLowerCase().includes(breedFilter.toLowerCase())
      );
    }

    setFilteredPets(filtered);
  }, [breedFilter, selectedPetType, selectedBreed, pets]);

  const handleRetry = () => {
    setRetryCount((prev) => prev + 1);
  };

  const openAppointmentModal = (pet) => {
    setSelectedPet(pet);
    setIsModalOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedPet(null);
    document.body.style.overflow = "auto";
  };

  const resetFilters = () => {
    setBreedFilter("");
    setSelectedPetType("all");
    setSelectedBreed("all");
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[300px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading pet patients...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-red-800">
                Error loading data
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={handleRetry}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8"></div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label
            htmlFor="pet-type-filter"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Pet Type
          </label>
          <select
            id="pet-type-filter"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={selectedPetType}
            onChange={(e) => {
              setSelectedPetType(e.target.value);
              setSelectedBreed("all");
            }}
          >
            <option value="all">All Types</option>
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="bird">Bird</option>
          </select>
        </div>

        <div>
          <label
            htmlFor="breed-select"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Breed
          </label>
          <select
            id="breed-select"
            className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            value={selectedBreed}
            onChange={(e) => setSelectedBreed(e.target.value)}
            disabled={selectedPetType === "all"}
          >
            <option value="all">All Breeds</option>
            {selectedPetType !== "all" &&
              PET_BREEDS[selectedPetType]?.map((breed) => (
                <option key={breed} value={breed.toLowerCase()}>
                  {breed}
                </option>
              ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="breed-search"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Search Breed
          </label>
          <div className="flex">
            <input
              type="text"
              id="breed-search"
              placeholder="Search breeds..."
              className="w-full px-4 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={breedFilter}
              onChange={(e) => setBreedFilter(e.target.value)}
            />
            <button
              onClick={resetFilters}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-r-md hover:bg-gray-300 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {filteredPets.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No pets found
          </h3>
          <p className="mt-1 text-gray-500">
            {breedFilter || selectedPetType !== "all" || selectedBreed !== "all"
              ? "No pets match the current filters."
              : "There are currently no pet patients registered in the system."}
          </p>
          {(breedFilter ||
            selectedPetType !== "all" ||
            selectedBreed !== "all") && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Clear all filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredPets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 border border-gray-100 hover:border-blue-100"
            >
              <div
                className={`bg-gradient-to-r ${
                  pet.pet_type?.toLowerCase() === "dog"
                    ? "from-amber-50 to-amber-100"
                    : pet.pet_type?.toLowerCase() === "cat"
                    ? "from-gray-50 to-gray-100"
                    : "from-blue-50 to-blue-100"
                } p-4 flex items-center justify-between`}
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    {getPetTypeIcon(pet.pet_type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-800">
                      {pet.name}
                    </h2>
                    <p className="text-sm text-gray-600 flex items-center">
                      {pet.breed || "Unknown breed"}
                      <span className="mx-2">•</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          pet.gender?.toLowerCase() === "male"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-pink-100 text-pink-800"
                        } flex items-center`}
                      >
                        <FaVenusMars className="mr-1" size={10} />
                        {pet.gender}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-xs text-gray-500 flex items-center">
                  <FaCalendarAlt className="mr-1" />
                  {pet.created_at
                    ? new Date(pet.created_at).toLocaleDateString()
                    : "Unknown"}
                </div>
              </div>

              <div className="p-4">
                <div className="flex gap-4">
                  {pet.photo_url ? (
                    <div className="w-28 h-28 relative rounded-xl overflow-hidden border-2 border-white shadow-md">
                      <Image
                        src={pet.photo_url}
                        alt={pet.name}
                        fill
                        className="object-cover"
                        sizes="112px"
                        priority={false}
                      />
                    </div>
                  ) : (
                    <div className="w-28 h-28 bg-gray-100 rounded-xl flex items-center justify-center border-2 border-white shadow-md">
                      <svg
                        className="h-10 w-10 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  )}

                  <div className="flex-1">
                    <div className="space-y-3">
                      <div className="flex items-center text-sm">
                        <FaWeight className="text-gray-500 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-500 mr-1">
                          Weight:
                        </span>
                        <span>
                          {pet.weight ? `${pet.weight} kg` : "Unknown"}
                        </span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaPalette className="text-gray-500 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-500 mr-1">
                          Color:
                        </span>
                        <span>{pet.color || "Unknown"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <FaUser className="text-gray-500 mr-2 flex-shrink-0" />
                        <span className="font-medium text-gray-500 mr-1">
                          Owner:
                        </span>
                        <span>{pet.owner?.first_name || "Unknown"}</span>
                      </div>

                      {/* row for contact number */}
                      <div className="flex items-center text-sm">
                        <svg
                          className="text-gray-500 mr-2 flex-shrink-0 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                          />
                        </svg>
                        <span className="font-medium text-gray-500 mr-1">
                          Contact:
                        </span>
                        <span>{pet.owner?.contact_number || "Unprovided"}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <svg
                          className="text-gray-500 mr-2 flex-shrink-0 w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        <span className="font-medium text-gray-500 mr-1">
                          Age:
                        </span>
                        <span>{pet.age ? `${pet.age} years` : "Unknown"}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {pet.appointments && pet.appointments.length > 0 && (
                  <button
                    onClick={() => openAppointmentModal(pet)}
                    className="mt-4 w-full py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg flex items-center justify-center space-x-2 hover:from-blue-600 hover:to-blue-700 transition-all"
                  >
                    <FaNotesMedical />
                    <span>
                      View {pet.appointments.length} appointment
                      {pet.appointments.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && selectedPet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 backdrop-blur-sm"
            onClick={closeModal}
          ></div>

          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 border border-gray-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 z-10 p-4 flex justify-between items-center rounded-t-xl">
              <div className="flex items-center space-x-3">
                {getPetTypeIcon(selectedPet.pet_type)}
                <h2 className="text-xl font-bold text-white">
                  Appointment History for {selectedPet.name}
                </h2>
              </div>
              <button
                onClick={closeModal}
                className="text-white hover:text-gray-200 p-1 rounded-full hover:bg-blue-800 transition-colors"
              >
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="p-6">
              {/* Pet Information Card */}
              <div className="mb-6 bg-gradient-to-r from-blue-50 to-blue-100 p-5 rounded-xl border border-blue-200 shadow-sm">
                <div className="flex items-center mb-3">
                  <svg
                    className="w-5 h-5 text-blue-700 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M7.75 4.19A6 6 0 0118 8c0 3.31-2.69 6-6 6a6 6 0 01-4.19-1.75l-4.4 4.4a1 1 0 01-1.41-1.42l4.39-4.39zM6 14a6 6 0 110-12 6 6 0 010 12z" />
                  </svg>
                  <h3 className="font-semibold text-lg text-blue-800">
                    Pet Information
                  </h3>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-100">
                    <p className="text-blue-600 font-medium flex items-center">
                      <FaCat className="mr-2" /> Type
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedPet.pet_type || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-100">
                    <p className="text-blue-600 font-medium flex items-center">
                      <FaDog className="mr-2" /> Breed
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedPet.breed || "Unknown"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-100">
                    <p className="text-blue-600 font-medium flex items-center">
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      Age
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedPet.age ? `${selectedPet.age} years` : "Unknown"}
                    </p>
                  </div>
                  <div className="bg-white p-3 rounded-lg shadow-xs border border-gray-100">
                    <p className="text-blue-600 font-medium flex items-center">
                      <FaUser className="mr-2" /> Owner
                    </p>
                    <p className="mt-1 font-medium">
                      {selectedPet.owner?.first_name || "Unknown"}
                    </p>

                    {/* contact number in modal */}
                    <p className="mt-1 text-sm text-gray-600 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      {selectedPet.owner?.contact_number || "No contact number"}
                    </p>
                  </div>
                </div>
              </div>

              {selectedPet.appointments.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center">
                    <FaNotesMedical className="text-blue-600 mr-2" />
                    <h3 className="font-semibold text-lg text-gray-800">
                      Recent Appointments ({selectedPet.appointments.length})
                    </h3>
                  </div>

                  <div className="overflow-hidden border border-gray-200 rounded-xl shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center">
                              <FaCalendarAlt className="mr-2" />
                              Date & Time
                            </div>
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Details
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedPet.appointments.map((appointment) => (
                          <tr key={appointment.id} className="hover:bg-gray-50">
                            <td className="px-4 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 bg-blue-100 p-2 rounded-lg mr-3">
                                  <svg
                                    className="w-5 h-5 text-blue-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                    />
                                  </svg>
                                </div>
                                <div>
                                  <div className="text-sm font-medium text-gray-900">
                                    {appointment.appointment_date
                                      ? new Date(
                                          appointment.appointment_date
                                        ).toLocaleDateString()
                                      : "-"}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {appointment.start_time &&
                                    appointment.end_time
                                      ? `${appointment.start_time} - ${appointment.end_time}`
                                      : "-"}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap">
                              {appointment.status ? (
                                <span
                                  className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${
                              appointment.status === "completed"
                                ? "bg-green-100 text-green-800"
                                : appointment.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                                >
                                  {appointment.status}
                                </span>
                              ) : (
                                "-"
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="text-sm text-gray-900">
                                {/* Show reason for decline if status is declined */}
                                {appointment.status === "declined" &&
                                  appointment.reason_for_decline && (
                                    <div className="mb-2">
                                      <p className="font-medium text-gray-500 text-xs flex items-center">
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                          />
                                        </svg>
                                        Reason for Decline:
                                      </p>
                                      <p className="text-sm mt-1 pl-5 bg-red-50 p-2 rounded">
                                        {appointment.reason_for_decline}
                                      </p>
                                    </div>
                                  )}

                                {/* Show symptoms for all statuses if symptoms exist */}
                                {appointment.symptoms &&
                                  appointment.symptoms.length > 0 && (
                                    <div className="mb-2">
                                      <p className="font-medium text-gray-500 text-xs flex items-center">
                                        <svg
                                          className="w-4 h-4 mr-1"
                                          fill="none"
                                          stroke="currentColor"
                                          viewBox="0 0 24 24"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                          />
                                        </svg>
                                        Symptoms:
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {appointment.symptoms.map(
                                          (symptom, idx) => (
                                            <div
                                              key={idx}
                                              className="group relative"
                                            >
                                              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded flex items-center cursor-help">
                                                <svg
                                                  className="w-3 h-3 mr-1"
                                                  fill="none"
                                                  stroke="currentColor"
                                                  viewBox="0 0 24 24"
                                                >
                                                  <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth={2}
                                                    d="M13 5l7 7-7 7M5 5l7 7-7 7"
                                                  />
                                                </svg>
                                                {symptom.name ||
                                                  "Unknown symptom"}
                                              </span>
                                              {symptom.description && (
                                                <div className="absolute z-10 hidden group-hover:block w-64 p-2 mt-1 text-xs text-gray-600 bg-white border border-gray-200 rounded shadow-lg">
                                                  {symptom.description}
                                                </div>
                                              )}
                                            </div>
                                          )
                                        )}
                                      </div>
                                    </div>
                                  )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-xl border border-gray-200">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="mt-2 text-lg font-medium text-gray-900">
                    No appointment history
                  </h3>
                  <p className="mt-1 text-gray-500">
                    There are no appointments recorded for this pet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
