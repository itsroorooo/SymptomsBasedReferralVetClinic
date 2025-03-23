"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HeaderUI() {
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

  return (
    <>
      {/* Navbar Section */}
      <nav
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 shadow-lg shadow-blue-300 ${
          scrollY > 50 ? "bg-gray-900 text-white" : "bg-white text-black"
        }`}
      >
        <div className="flex items-center justify-between p-4 px-6 md:px-12">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <Image
              src="/image/Logoblue.png"
              width={56}
              height={56}
              alt="SymptoVet Logo"
              className="w-14 h-auto"
            />
            <span className="text-2xl font-bold">
              <span className={`${scrollY > 50 ? "text-white" : "text-black"}`}>
                Sympto
              </span>
              <span className="text-blue-500">Vet</span>
            </span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex flex-1 justify-center">
            <ul className="flex items-center text-lg space-x-8">
              {["Home", "Offers", "About", "Contact"].map((item, index) => (
                <li key={index}>
                  <button
                    onClick={() => scrollToSection(item.toLowerCase())}
                    className="hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
                  >
                    {item}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Login & Register Buttons (Right Side) */}
          <div className="hidden md:flex items-center space-x-4">
            <span
              onClick={() => router.push("/login")}
              className="text-lg hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
            >
              Login
            </span>
            <span className={`${scrollY > 50 ? "text-white" : "text-black"}`}>
              {" "}
              |{" "}
            </span>
            <span
              onClick={() => router.push("/register")}
              className="text-lg hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
            >
              Register
            </span>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white focus:outline-none"
            onClick={() => setIsNavOpen(!isNavOpen)}
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
                d={
                  isNavOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"
                }
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu (Centered) */}
        <div
          className={`${
            isNavOpen ? "block" : "hidden"
          } md:hidden bg-gray-900 text-white absolute top-16 left-0 w-full shadow-md transition-all duration-300`}
        >
          <ul className="flex flex-col items-center text-lg space-y-4 p-6">
            {["Home", "Offers", "About", "Contact"].map((item, index) => (
              <li key={index}>
                <a
                  onClick={() => {
                    scrollToSection(item.toLowerCase());
                    setIsNavOpen(false);
                  }}
                  className="block hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
                >
                  {item}
                </a>
              </li>
            ))}
            {/* Login & Register for Mobile */}
            <li>
              <a
                onClick={() => {
                  router.push("/auth/login");
                  setIsNavOpen(false);
                }}
                className="block hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
              >
                Login
              </a>
            </li>
            <li>
              <a
                onClick={() => {
                  router.push("/auth/register");
                  setIsNavOpen(false);
                }}
                className="block hover:bg-blue-500 hover:text-white px-4 py-2 rounded cursor-pointer"
              >
                Register
              </a>
            </li>
          </ul>
        </div>
      </nav>
    </>
  );
}
