"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function LoadingScreen() {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade out after 2 seconds
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 2000);

    // Remove component after fade out completes
    const removeTimer = setTimeout(() => {
      setLoading(false);
    }, 3000); // 1s for fade out (matches CSS transition)

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (!loading) return null;

  return (
    <div
      className={`fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center 
      transition-opacity duration-1000 ${
        fadeOut ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="animate-pulse">
        <Image
          src="/image/logo_blue.png"
          alt="SymptoVet Logo"
          width={200}
          height={200}
        />
      </div>
      <span className="text-2xl font-bold">
        <span className="text-white">Sympto</span>
        <span className="text-blue-500">Vet</span>
      </span>
      <p className="mt-2 text-gray-400">Your trusted veterinary solution</p>
    </div>
  );
}
