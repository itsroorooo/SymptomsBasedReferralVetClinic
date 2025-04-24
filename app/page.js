"use client";

import { useState, useEffect } from "react";
import Headers from "./components/Headers/page.jsx";
import HomeSection from "./components/landing/HomeSection.jsx";
import OffersSection from "./components/landing/OfferSection.jsx";
import AboutUsSection from "./components/landing/AboutUsSection.jsx";
import TeamSection from "./components/landing/TeamSection.jsx";
import LoadingScreen from "./components/LoadingScreen";

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Headers />
      <HomeSection />
      <OffersSection />
      <AboutUsSection />
      <TeamSection />
    </>
  );
}
