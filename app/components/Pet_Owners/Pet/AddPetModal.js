"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

const petBreeds = {
  dog: ["Beagle", "Bulldog", "Chihuahua", "Corgi", "German Shepherd", "Husky", "Labrador Retriever", "Poodle", "Pug", "Other"],
  cat: ["Bengal", "Burmese", "Maine Coon", "Ragdoll", "Scottish Fold", "Siamese", "Siberian", "Sphynx", "Persian", "Other"],
  bird: ["Canary", "Cockatiel", "Dove", "Hummingbird", "Lovebird", "Parrot", "Pigeons", "Robin", "Parakeet", "Other"],
  other: ["Rabbit", "Hamster", "Guinea Pig", "Turtle", "Other"]
};

export default function AddPetModal({ onAddPet, onEditPet, petToEdit, onClose }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    age: "",
    type: "dog",
    breed: "",
    weight: "",
    color: "",
    medicalHistory: "",
    photo: null
  });
  const [previewUrl, setPreviewUrl] = useState("");
  const [availableBreeds, setAvailableBreeds] = useState(petBreeds.dog);
  const [breedSearch, setBreedSearch] = useState("");
  const [showBreedDropdown, setShowBreedDropdown] = useState(false);
  const breedDropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const supabase = createClient();

  // Filter breeds based on search input
  const filteredBreeds = availableBreeds.filter(breed =>
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
        photo: null
      });
      setPreviewUrl(petToEdit.photo_url || "");
      setIsOpen(true);
    }
  }, [petToEdit]);

  useEffect(() => {
    setAvailableBreeds(petBreeds[formData.type]);
    if (formData.type !== (petToEdit?.pet_type || "dog")) {
      setFormData(prev => ({ ...prev, breed: "" }));
      setBreedSearch("");
    }
  }, [formData.type, petToEdit]);

  useEffect(() => {
    if (isOpen) setIsAnimating(true);
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (breedDropdownRef.current && !breedDropdownRef.current.contains(event.target)) {
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
        photo: null
      });
      setBreedSearch("");
      onClose?.();
    }, 200);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleBreedSearchChange = (e) => {
    setBreedSearch(e.target.value);
    setShowBreedDropdown(true);
  };

  const selectBreed = (breed) => {
    setFormData(prev => ({ ...prev, breed }));
    setBreedSearch(breed);
    setShowBreedDropdown(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData(prev => ({ ...prev, photo: file }));
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const petData = {
        name: formData.name,
        pet_type: formData.type,
        breed: formData.breed,
        age: parseInt(formData.age) || null,
        weight: parseFloat(formData.weight) || null,
        color: formData.color,
        photo_url: previewUrl,
        owner_id: user.id
      };

      let result;
      if (petToEdit) {
        result = await supabase
          .from('pets')
          .update(petData)
          .eq('id', petToEdit.id)
          .select();
      } else {
        result = await supabase
          .from('pets')
          .insert(petData)
          .select();
      }

      if (result.error) throw result.error;

      if (petToEdit) {
        onEditPet(result.data[0]);
      } else {
        onAddPet(result.data[0]);
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
          className="ml-8 group relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-medium text-white transition-all duration-300 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 focus:ring-4 focus:outline-none focus:ring-blue-300 shadow-lg hover:shadow-blue-500/50"
        >
          <span className="relative flex items-center gap-2 ">
            <svg
              className="w-5 h-5"
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
        </button>
      )}

      {(isOpen || petToEdit) && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 ml-54 ${
            isAnimating ? "opacity-100" : "opacity-0"
          } transition-opacity duration-200 ease-in-out`}
          onClick={handleClose}
        >
          <div
            className={`relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-2xl  ${
              isAnimating ? "scale-100" : "scale-95"
            } transition-transform duration-200 ease-in-out`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-gray-200 rounded-t-xl bg-gradient-to-r from-blue-500 to-gray-900">
              <h3 className="text-xl font-bold text-white">
                {petToEdit ? "Edit Pet" : "Add New Pet"}
              </h3>
              <button
                type="button"
                onClick={handleClose}
                className="text-white hover:text-gray-200 hover:bg-blue-500 px-4 py-3 rounded-md transition-colors duration-200"
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
                <span className="sr-only">Close modal</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Photo Upload */}
              <div className="flex flex-col items-center">
                <div
                  onClick={triggerFileInput}
                  className={`w-24 h-24 rounded-full mb-2 cursor-pointer flex items-center justify-center ${
                    previewUrl
                      ? "bg-transparent"
                      : "bg-gray-100 dark:bg-gray-700"
                  } border-2 border-dashed border-gray-300 dark:border-gray-600`}
                >
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Pet preview"
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <svg
                      className="w-10 h-10 text-gray-400"
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
                  )}
                </div>
                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {previewUrl ? "Change Photo" : "Upload Photo"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Pet Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Pet Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      className="w-4 h-4 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
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
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 p-2.5"
                    placeholder="e.g. Fluffy"
                    required
                  />
                </div>
              </div>

              {/* Age and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Age */}
                <div>
                  <label
                    htmlFor="age"
                    className="block mb-2 text-sm font-medium text-gray-700"
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
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="e.g. 3"
                      min="0"
                      max="30"
                      required
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                      years
                    </span>
                  </div>
                </div>

                {/* Pet Type */}
                <div>
                  <label
                    htmlFor="type"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Pet Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    required
                  >
                    <option value="dog">Dog</option>
                    <option value="cat">Cat</option>
                    <option value="bird">Bird</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              {/* Breed Dropdown with Search */}
              <div className="relative" ref={breedDropdownRef}>
                <label
                  htmlFor="breed"
                  className="block mb-2 text-sm font-medium text-gray-700"
                >
                  Breed <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="breed"
                  name="breed"
                  value={breedSearch}
                  onChange={handleBreedSearchChange}
                  onFocus={() => setShowBreedDropdown(true)}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  placeholder="Search or select breed"
                  required
                  disabled={!formData.type}
                />
                {showBreedDropdown && filteredBreeds.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredBreeds.map((breed) => (
                      <div
                        key={breed}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => selectBreed(breed)}
                      >
                        {breed}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Weight and Color */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Weight */}
                <div>
                  <label
                    htmlFor="weight"
                    className="block mb-2 text-sm font-medium text-gray-700"
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
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                      placeholder="e.g. 10"
                      min="0"
                      step="0.1"
                    />
                    <span className="absolute right-3 top-2.5 text-sm text-gray-500">
                      kg
                    </span>
                  </div>
                </div>

                {/* Color */}
                <div>
                  <label
                    htmlFor="color"
                    className="block mb-2 text-sm font-medium text-gray-700"
                  >
                    Color
                  </label>
                  <input
                    type="text"
                    id="color"
                    name="color"
                    value={formData.color}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                    placeholder="e.g. Black, White, etc."
                  />
                </div>
              </div>
            

              {/* Form Actions */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 text-sm font-medium text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-4 focus:ring-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:bg-blue-500 dark:hover:bg-blue-600 dark:focus:ring-blue-700 transition-colors duration-200 flex items-center justify-center"
                >
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
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
