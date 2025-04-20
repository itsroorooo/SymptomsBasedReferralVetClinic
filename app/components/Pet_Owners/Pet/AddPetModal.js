"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const petBreeds = {
  dog: [
    "Beagle",
    "Bulldog",
    "Chihuahua",
    "Corgi",
    "German Shepherd",
    "Husky",
    "Labrador Retriever",
    "Poodle",
    "Pug",
    "Other",
  ],
  cat: [
    "Bengal",
    "Burmese",
    "Maine Coon",
    "Ragdoll",
    "Scottish Fold",
    "Siamese",
    "Siberian",
    "Sphynx",
    "Persian",
    "Other",
  ],
  bird: [
    "Canary",
    "Cockatiel",
    "Dove",
    "Hummingbird",
    "Lovebird",
    "Parrot",
    "Pigeons",
    "Robin",
    "Parakeet",
    "Other",
  ],
  other: ["Rabbit", "Hamster", "Guinea Pig", "Turtle", "Other"],
};

export default function AddPetModal({
  onAddPet,
  onEditPet,
  petToEdit,
  onClose,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    type: "dog",
    breed: "",
    weight: "",
    color: "",
    photo: null,
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [availableBreeds, setAvailableBreeds] = useState(petBreeds.dog);
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const breedDropdownRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  // Filter breeds based on search input
  const filteredBreeds = availableBreeds.filter((breed) =>
    breed.toLowerCase().includes(breedSearch.toLowerCase())
  );

  useEffect(() => {
    if (petToEdit) {
      setFormData({
        name: petToEdit.name,
        age: petToEdit.age?.toString() || "",
        type: petToEdit.pet_type || "dog",
        breed: petToEdit.breed || "",
        weight: petToEdit.weight?.toString() || "",
        color: petToEdit.color || "",
        gender: petToEdit.gender || "",
        photo: null,
      });
      setPreviewUrl(petToEdit.photo_url || "");
      setIsOpen(true);
    }
  }, [petToEdit]);

  useEffect(() => {
    setAvailableBreeds(petBreeds[formData.type]);
    if (formData.type !== (petToEdit?.pet_type || "dog")) {
      setFormData((prev) => ({ ...prev, breed: "" }));
      setBreedSearch("");
    }
  }, [formData.type, petToEdit]);

  useEffect(() => {
    if (isOpen) setIsAnimating(true);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        breedDropdownRef.current &&
        !breedDropdownRef.current.contains(event.target)
      ) {
        setShowBreedDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      setIsOpen(false);
      setPreviewUrl("");
      setFormData({
        name: "",
        age: "",
        type: "dog",
        breed: "",
        weight: "",
        color: "",
        gender: "",
        photo: null,
      });
      setBreedSearch("");
      onClose?.();
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleBreedSearchChange = (e) => {
    setBreedSearch(e.target.value);
    setShowBreedDropdown(true);
  };

  const selectBreed = (breed) => {
    setFormData((prev) => ({ ...prev, breed }));
    setBreedSearch(breed);
    setShowBreedDropdown(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const petData = {
        name: formData.name,
        pet_type: formData.type,
        breed: formData.breed,
        age: parseInt(formData.age) || null,
        weight: parseFloat(formData.weight) || null,
        color: formData.color,
        photo_url: previewUrl,
        gender: formData.gender,
        owner_id: user.id,
      };

      if (petToEdit) {
        // For editing, include the ID
        petData.id = petToEdit.id;
        await onEditPet(petData);
      } else {
        await onAddPet(petData);
      }

      handleClose();
    } catch (error) {
      console.error("Error saving pet:", error);
      alert(`Error saving pet: ${error.message}`);
    }
  };

  return (
    <>
      {!petToEdit && (
        <button
          onClick={() => setIsOpen(true)}
          className="ml-8 group relative inline-flex items-center justify-center px-6 py-3.5 overflow-hidden font-medium text-white transition-all duration-300 rounded-xl bg-blue-500 hover:bg-blue-600 focus:ring-4 focus:outline-none focus:ring-blue-300 shadow-lg hover:shadow-blue-500/50"
        >
          <span className="relative flex items-center gap-2">
            <svg
              className="w-5 h-5 transition-transform group-hover:scale-110"
              fill="currentColor"
              viewBox="0 0 20 20"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                clipRule="evenodd"
              ></path>
            </svg>
            Add New Pet
          </span>
          <span className="absolute inset-0 bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300"></span>
        </button>
      )}

      {(isOpen || petToEdit) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-gray-900/50 ${
            isAnimating ? "opacity-100" : "opacity-0"
          } transition-opacity duration-300 ease-out`}
          onClick={handleClose}
        >
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 ${
              isAnimating ? "scale-100" : "scale-95"
            } transition-transform duration-300 ease-out`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="sticky top-0 z-10 p-6 border-b border-gray-200 dark:border-gray-700 bg-blue-500 dark:bg-gray-900 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white dark:text-white">
                  {petToEdit ? "Edit Pet Details" : "Add a New Pet"}
                </h3>
                <button
                  type="button"
                  onClick={handleClose}
                  className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
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
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              <p className="mt-1 text-sm text-gray-800 dark:text-gray-400">
                {petToEdit
                  ? "Update your pet's information"
                  : "Fill in the details to add a new pet to your profile"}
              </p>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Photo Upload Section */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <div
                    onClick={triggerFileInput}
                    className={`w-32 h-32 rounded-full mb-4 cursor-pointer flex items-center justify-center overflow-hidden ${
                      previewUrl
                        ? "border-4 border-blue-100 dark:border-blue-900/50"
                        : "bg-gray-100 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700"
                    } transition-all duration-200 group-hover:border-blue-300 dark:group-hover:border-blue-500`}
                  >
                    {previewUrl ? (
                      <img
                        src={previewUrl}
                        alt="Pet preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center p-4">
                        <svg
                          className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="1.5"
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          ></path>
                        </svg>
                        <span className="block mt-1 text-xs text-gray-500 dark:text-gray-400">
                          Click to upload
                        </span>
                      </div>
                    )}
                  </div>
                  {previewUrl && (
                    <button
                      type="button"
                      onClick={triggerFileInput}
                      className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 text-xs rounded-full shadow-md hover:bg-blue-600 transition-colors flex items-center"
                    >
                      <svg
                        className="w-3 h-3 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                        ></path>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                        ></path>
                      </svg>
                      Change
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Form Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Pet Name */}
                <div className="col-span-2">
                  <label
                    htmlFor="name"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Pet Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-500 dark:text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        ></path>
                      </svg>
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                      placeholder="e.g. Fluffy"
                      required
                    />
                  </div>
                </div>

                {/* Age and Type */}
                <div>
                  <label
                    htmlFor="age"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Age <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="age"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                      placeholder="e.g. 3"
                      min="0"
                      max="30"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">
                      years
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="type"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Pet Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="rabbit">Rabbit</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Gender Field - Added Here */}
                <div>
                  <label
                    htmlFor="gender"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Gender <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="unknown">Unknown</option>
                  </select>
                </div>

                {/* Breed Dropdown with Search */}
                <div className="col-span-2">
                  <label
                    htmlFor="breed"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Breed <span className="text-red-500">*</span>
                  </label>
                  <div className="relative" ref={breedDropdownRef}>
                    <input
                      type="text"
                      id="breed"
                      name="breed"
                      value={breedSearch}
                      onChange={handleBreedSearchChange}
                      onFocus={() => setShowBreedDropdown(true)}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder={
                        formData.type
                          ? "Search or select breed"
                          : "Select pet type first"
                      }
                      required
                      disabled={!formData.type}
                    />
                    {showBreedDropdown && filteredBreeds.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredBreeds.map((breed) => (
                          <div
                            key={breed}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-gray-900 dark:text-white"
                            onClick={() => selectBreed(breed)}
                          >
                            {breed}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Weight and Color */}
                <div>
                  <label
                    htmlFor="weight"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Weight
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      id="weight"
                      name="weight"
                      value={formData.weight}
                      onChange={handleChange}
                      className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-10"
                      placeholder="e.g. 10"
                      min="0"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500 dark:text-gray-400">
                      kg
                    </span>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="color"
                    className="block mb-2 text-sm font-medium text-gray-900 dark:text-white"
                  >
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g. Black, White, etc."
                  />
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-3 text-sm font-medium text-gray-900 dark:text-white bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-3 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-md transition-all flex items-center"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
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
                      {petToEdit ? "Updating..." : "Adding..."}
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                          clipRule="evenodd"
                        ></path>
                      </svg>
                      {petToEdit ? "Update Pet" : "Add Pet"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
