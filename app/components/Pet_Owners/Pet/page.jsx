"use client";

import { useState, useEffect } from "react";
import AddPetModal from "./AddPetModal";
import { createClient } from "@/utils/supabase/client";

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [petToEdit, setPetToEdit] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAddingPet, setIsAddingPet] = useState(false);
  const [userId, setUserId] = useState(null);
  const supabase = createClient();

  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUserId();
  }, []);

  // Fetch pets from Supabase (only for current user)
  useEffect(() => {
    if (!userId) return;

    const fetchPets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pets")
          .select("*")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });

        if (error) throw error;
        setPets(data || []);
      } catch (error) {
        console.error("Error fetching pets:", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPets();

    // Set up real-time updates
    const channel = supabase
      .channel("pets-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pets",
          filter: `owner_id=eq.${userId}`,
        },
        (payload) => {
          setPets((prevPets) => {
            // Handle INSERT
            if (payload.eventType === "INSERT") {
              return [payload.new, ...prevPets];
            }
            // Handle UPDATE
            else if (payload.eventType === "UPDATE") {
              return prevPets.map((pet) =>
                pet.id === payload.new.id ? payload.new : pet
              );
            }
            // Handle DELETE
            else if (payload.eventType === "DELETE") {
              return prevPets.filter((pet) => pet.id !== payload.old.id);
            }
            return prevPets;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleAddPet = async (newPet) => {
    try {
      setIsAddingPet(true);
      const { data, error } = await supabase
        .from("pets")
        .insert([{ ...newPet, owner_id: userId }])
        .select();

      if (error) throw error;

      // Optimistically update local state immediately
      setPets((prev) => [data[0], ...prev]);

      return data[0];
    } catch (error) {
      console.error("Error adding pet:", error.message);
      throw error;
    } finally {
      setIsAddingPet(false);
    }
  };

  const handleEditPet = async (updatedPet) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("pets")
        .update(updatedPet)
        .eq("id", updatedPet.id)
        .select();

      if (error) throw error;

      // Optimistically update local state
      setPets((prev) =>
        prev.map((pet) => (pet.id === updatedPet.id ? data[0] : pet))
      );

      setPetToEdit(null);
      return data[0];
    } catch (error) {
      console.error("Error updating pet:", error.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!petToDelete) return;

    try {
      setLoading(true);
      // Optimistically remove from local state first
      setPets((prev) => prev.filter((pet) => pet.id !== petToDelete));

      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petToDelete);

      if (error) throw error;
      setPetToDelete(null);
    } catch (error) {
      console.error("Error deleting pet:", error.message);
      // Revert if error occurs
      setPets((prev) => [...prev]);
    } finally {
      setLoading(false);
    }
  };

  const cancelDelete = () => {
    setPetToDelete(null);
  };

  return (
    <div className="m-10 max-w-7xl mx-auto ml-10 mr-10">
      <div className="flex justify-between items-center m-4">
        <h1 className="text-2xl font-bold text-gray-800"></h1>
        {pets.length > 0 && (
          <AddPetModal
            onAddPet={handleAddPet}
            onEditPet={handleEditPet}
            petToEdit={petToEdit}
            onClose={() => {
              setPetToEdit(null);
            }}
            isSubmitting={isAddingPet || loading}
            trigger={
              <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                Add New Pet
              </button>
            }
          />
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {petToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">Delete Pet?</h3>
              <button
                onClick={cancelDelete}
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <svg
                  className="w-6 h-6"
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
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this pet? All associated health
              records will also be removed.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelDelete}
                className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50   transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-4 focus:ring-red-300 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Deleting...
                  </span>
                ) : (
                  "Delete"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {loading && !pets.length ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 dark:border-blue-400"></div>
        </div>
      ) : pets.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
            >
              <div className="relative h-56 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600">
                {pet.photo_url ? (
                  <img
                    src={pet.photo_url}
                    alt={pet.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="w-20 h-20 text-gray-400 dark:text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-4 right-4 flex space-x-3">
                  <button
                    onClick={() => setPetToEdit(pet)}
                    className="p-2.5 bg-white dark:bg-gray-700 rounded-full shadow-md text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Edit pet"
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={() => setPetToDelete(pet.id)}
                    className="p-2.5 bg-white dark:bg-gray-700 rounded-full shadow-md text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-600 transition-colors"
                    aria-label="Delete pet"
                    disabled={loading}
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white truncate">
                      {pet.name}
                    </h2>
                    <span className="text-sm px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full">
                      {pet.pet_type}
                    </span>
                  </div>
                  {pet.birth_date && (
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Born: {new Date(pet.birth_date).toLocaleDateString()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-5">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Breed</p>
                    <p className="font-medium text-gray-700 dark:text-gray-200 capitalize">
                      {pet.breed.toLowerCase() || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Age</p>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {pet.age} {pet.age === 1 ? "year" : "years"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Gender</p>
                    <p className="font-medium text-gray-700 dark:text-gray-200 capitalize">
                      {pet.gender?.toLowerCase() || "Unknown"}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Weight</p>
                    <p className="font-medium text-gray-700 dark:text-gray-200">
                      {pet.weight ? `${pet.weight} kg` : "Unknown"}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <button className="flex-1 py-3 px-4 text-sm font-medium text-white bg-blue-600 dark:bg-blue-500 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors flex items-center justify-center">
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    Health Records
                  </button>
                  <button className="flex-1 py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors flex items-center justify-center">
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
                    Schedule
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-700 rounded-xl border border-dashed border-gray-300 dark:border-gray-600">
          <svg
            className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
            No pets registered yet
          </h3>
          <p className="mt-2 text-gray-500 dark:text-gray-400">
            Add your first pet to get started with health tracking
          </p>
          <div className="mt-6">
            <AddPetModal
              onAddPet={handleAddPet}
              onEditPet={handleEditPet}
              petToEdit={petToEdit}
              onClose={() => {
                setPetToEdit(null);
                setIsModalOpen(false);
              }}
              isSubmitting={isAddingPet || loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}
