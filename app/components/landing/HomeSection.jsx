"use client";

import Image from "next/image";

export default function HomeSection() {
  return (
    <section
      id="home"
      className="bg-white flex flex-col md:flex-row items-center max-w-full mx-auto px-6 md:px-16 pt-18 space-y-4 md:space-y-6 md:space-x-4 translate-y-10 transition-all duration-700 ease-out scroll-trigger"
    >
      {/* Content */}
      <div className="md:w-1/2 lg:w-1/2 mt-40 text-center md:text-left">
        <h1 className="text-center text-3xl md:text-5xl font-bold text-black leading-tight">
          Your Best Option for Pet Care Solutions
        </h1>

        <p className="mt-6 text-justify text-lg md:text-xl text-gray-700 py-6">
          Where health is best! Our platform instantly connects you to pet care
          solutions, ensuring your furry friends receive the attention they need
          right at home. Experience peace of mind knowing that, with us, your
          pets are always just a step away from the care they deserve, keeping
          tails wagging and hearts happy!
        </p>

        {/* Get Started Button */}
        <div className="mt-6 ml-95 flex justify-center md:justify-start transition ease-in-out delay-100 hover:translate-y-1 hover:scale-110">
          <a
            href="#"
            className="text-lg bg-blue-500 hover:bg-black text-white px-6 py-4 rounded shadow"
          >
            Get Started
          </a>
        </div>
      </div>

      {/* Image - hidden on small screens, visible from md breakpoint up */}
      <div className="hidden md:block md:w-1/2 flex justify-center items-center px-6 md:px-12 pt-8 translate-y-10 transition-all duration-700 ease-out scroll-trigger">
        <Image
          src="/image/panda.png"
          width={900}
          height={500}
          alt="Panda and Pets"
          quality={100}
          className="object-contain"
        />
      </div>
    </section>
  );
}
