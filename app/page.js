import Headers from "./components/Headers/page.jsx";
import HomeSection from "./components/landing/HomeSection.jsx";
import OffersSection from "./components/landing/OfferSection.jsx";
import AboutUsSection from "./components/landing/AboutUsSection.jsx";
import TeamSection from "./components/landing/TeamSection.jsx";

export default function Home() {
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
