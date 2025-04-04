"use client";

import { useState, useEffect } from "react";
import AddPetModal from "./AddPetModal";
import { createClient } from "@/utils/supabase/client";

export default function PetsPage() {
  const [pets, setPets] = useState([]);
  const [petToEdit, setPetToEdit] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  // Initialize Supabase client
  const supabase = createClient();

  // Fetch pets from Supabase
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("pets")
          .select("*")
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
        { event: "*", schema: "public", table: "pets" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setPets((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === "UPDATE") {
            setPets((prev) =>
              prev.map((pet) => (pet.id === payload.new.id ? payload.new : pet))
            );
          } else if (payload.eventType === "DELETE") {
            setPets((prev) => prev.filter((pet) => pet.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      // Ensure the channel is removed only if it's still active
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleAddPet = async (newPet) => {
    try {
      // Create a clean pet object without any ID if it exists
      const { id, ...petWithoutId } = newPet;

      const { data, error } = await supabase
        .from("pets")
        .insert([petWithoutId]) // Insert without the 'id' field
        .select();

      if (error) throw error;

      console.log("Pet added successfully:", data);
      return data[0]; // Return the first (and only) inserted pet
    } catch (error) {
      console.error("Error adding pet:", error.message);
      throw error; // Re-throw to let the calling component handle it
    }
  };

  const handleEditPet = async (updatedPet) => {
    try {
      const { error } = await supabase
        .from("pets")
        .update(updatedPet)
        .eq("id", updatedPet.id);

      if (error) throw error;
      setPetToEdit(null);
    } catch (error) {
      console.error("Error updating pet:", error.message);
      throw error;
    }
  };

  const confirmDelete = async () => {
    if (!petToDelete) return;

    try {
      const { error } = await supabase
        .from("pets")
        .delete()
        .eq("id", petToDelete);

      if (error) throw error;
      setPetToDelete(null);
    } catch (error) {
      console.error("Error deleting pet:", error.message);
    }
  };

  const cancelDelete = () => {
    setPetToDelete(null);
  };

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex justify-between items-center mb-8 ml-164">
        <AddPetModal
          onAddPet={handleAddPet}
          onEditPet={handleEditPet}
          petToEdit={petToEdit}
          onClose={() => setPetToEdit(null)}
        />
      </div>

      {/* Delete Confirmation Modal */}
      {petToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                Confirm Deletion
              </h3>
              <button
                onClick={cancelDelete}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this pet? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 dark:bg-red-500 dark:hover:bg-red-600 dark:focus:ring-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {pets.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white dark:bg-gray-700 rounded-xl shadow-md overflow-hidden transition-transform duration-300 hover:scale-105"
            >
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-4">
                    {pet.photo_url ? (
                      <img
                        src={pet.photo_url}
                        alt={pet.name}
                        className="w-16 h-16 rounded-full object-cover border-2 border-blue-500"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">
                        {pet.name}
                      </h2>
                      <p className="text-gray-600 dark:text-gray-300 capitalize">
                        {pet.breed.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPetToEdit(pet)}
                      className="text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      aria-label="Edit pet"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        ></path>
                      </svg>
                    </button>
                    <button
                      onClick={() => setPetToDelete(pet.id)}
                      className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      aria-label="Delete pet"
                    >
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        ></path>
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Age:</span> {pet.age} years
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Type:</span>{" "}
                    <span className="capitalize">{pet.pet_type}</span>
                  </p>
                  {pet.medical_history && (
                    <div className="mt-3">
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Medical History
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {pet.medical_history}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 ml-115 mt-54">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">
            No pets added yet
          </h3>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Get started by adding your first pet!
          </p>
        </div>
      )}
    </div>
  );
}
