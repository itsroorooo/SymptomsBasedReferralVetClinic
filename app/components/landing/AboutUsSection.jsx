"use client";

import Image from "next/image";

export default function AboutUsSection() {
  return (
    <section
      id="about"
      className="flex flex-col mt-10 md:flex-row items-center mb-12 mx-auto py-12 px-6 md:px-20 bg-gray-50"
    >
      {/* Content (Left Side) */}
      <div className="md:w-1/2 text-justify text-lg md:text-xl text-gray-700">
        <h2 className="font-bold text-3xl text-center md:text-5xl text-black leading-tight mb-12">
          Know More About Our Website
        </h2>
        <p className="mb-6">
          We are passionate about providing the best care for your beloved pets.
          Our mission is to make pet care accessible, convenient, and
          stress-free for pet owners everywhere. We understand that your pets
          are more than just animals; they are cherished members of your family.
        </p>
        <p className="mb-6">
          Our platform was founded by a team of pet lovers and veterinary
          professionals who saw the need for a more streamlined approach to pet
          care. Whether you need to find a nearby vet, book an appointment, or
          get expert advice, we are here to help you every step of the way.
        </p>
        <p className="mb-6">
          What sets us apart is our commitment to quality and convenience. We
          partner with trusted veterinarians and pet care experts to ensure that
          your pets receive the highest standard of care. Our user-friendly
          platform is designed to save you time and provide peace of mind,
          knowing that your pets are in good hands.
        </p>
        <p className="mb-6">
          Join our growing community of pet owners who trust us to keep their
          pets healthy and happy. Together, we can make pet care easier and more
          enjoyable for everyone.
        </p>
      </div>

      {/* Image Container (Right Side) */}
      <div className="md:w-1/2 relative flex mt-8 md:mt-0">
        {/* First Image */}
        <div className="w-96 h-96  relative z-10 flex overflow-hidden rounded-lg shadow-lg lg:ml-30 ml-38 ">
          <Image
            src="/image/deku.jpg"
            width={500}
            height={400}
            alt="Baby dog color black"
            quality={100}
            className="object-cover"
          />
        </div>

        {/* Second Image (Overlapping) */}
        <div className="w-96 h-96 absolute top-1/2 left-1/2 transform -translate-y-1/5 -translate-x-1/5 z-20 rounded-lg shadow-lg overflow-hidden">
          <Image
            src="/image/kuromi.jpg"
            width={384}
            height={384}
            alt="About Us Pets 2"
            quality={100}
            className="object-cover w-full h-full mb-6"
          />
        </div>
      </div>
    </section>
  );
}
