"use client";

import Image from "next/image";

export default function OffersSection() {
  return (
    <section
      id="offers"
      className="mx-auto py-8 px-6 md:px-20 scroll-smooth md:scroll-auto"
    >
      <h2 className="font-bold mt-4 text-center text-3xl md:text-5xl text-black leading-tight">
        What Does Our Website Offer?
      </h2>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-8">
        {[
          {
            title: "Locate Your Nearest Vet Clinic",
            image: "/image/map.png",
            description:
              "Quickly find the closest veterinary clinic to ensure your pet gets the care they need without delay. With our easy-to-use tool, locating trusted vets nearby has never been simpler.",
          },
          {
            title: "Book an appointment",
            image: "/image/book.jpeg",
            description:
              "Save time and hassle by booking your pet's appointment online. Choose a convenient time that works for you and ensure your furry friend gets the attention they deserve.",
          },
          {
            title: "Get the Best Expert Advice",
            image: "/image/expert.jpg",
            description:
              "Receive professional guidance from experienced veterinarians. Whether it's a health concern or routine care, trust the experts to provide the best advice for your pet's well-being.",
          },
        ].map((card, index) => (
          <div
            key={index}
            className="group relative cursor-pointer items-center justify-center overflow-hidden transition-shadow hover:shadow-xl hover:shadow-blue-500"
          >
            <div className="h-96 w-full">
              <Image
                src={card.image}
                alt={card.title}
                width={400}
                height={400}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:rotate-3 group-hover:scale-125"
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black group-hover:from-black/70 group-hover:via-black/60 group-hover:to-black/70"></div>
            <div className="absolute inset-0 flex translate-y-[60%] flex-col items-center justify-center px-9 text-center transition-all duration-500 group-hover:translate-y-0">
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                {card.title}
              </h1>
              <p className="mb-10 text-sm md:text-lg italic text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                {card.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
