"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function useHeader() {
  const router = useRouter();
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);

  // Detect scroll position
  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Smooth scrolling
  const scrollToSection = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setIsNavOpen(false); // Close mobile menu after click
  };

  return {
    isNavOpen,
    setIsNavOpen,
    scrollY,
    scrollToSection,
    router,
  };
}
