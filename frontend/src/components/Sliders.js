"use client";

import Image from "next/image";
import React from "react";
import SlickSlider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const slides = [
  {
    image: "front1.png",
    title: "NBL begins!",
    description:
      "NBL setup for thrilling start this weekends",
    buttonText: "DETAILS",
  },
  {
    image: "front2.png",
    title: "KATHMANDU GOLDENS EYE HISTORIC WIN",
    description:
      "Kathmandu Goldens look to secure their first-ever NBL championship as they prepare for the grand finale.",
    buttonText: "PREVIEW",
  },
  {
    image: "front3.png",
    title: "TAC’S DEFENSE STUNS ROYALS",
    description:
      "Tribhuvan Army Club's tough defense shuts down Budhanilkantha Royals in a thrilling semi-final clash.",
    buttonText: "HIGHLIGHTS",
  },
  {
    image: "front4.png",
    title: "GOLDENS' ROAD TO THE FINALS",
    description:
      "With strong team chemistry and back-to-back wins, Kathmandu Goldens storm into their first-ever NBL final.",
    buttonText: "WATCH JOURNEY",
  },
];


const settings = {
  dots: true,
  infinite: true,
  speed: 500,
  autoplay: true,
  autoplaySpeed: 2500,
  slidesToShow: 1,
  slidesToScroll: 1,
};

const SliderWrapper = () => {
  return (
    <div className="w-full flex mx-0 px-12 my-4">
      <div className="w-[1020px] h-[430px] relative overflow-hidden rounded-md ">
        <SlickSlider {...settings}>
          {slides.map((slide, i) => (
            <div key={i} className="relative w-full h-[420px]  hover:scale-102 duration-900 ">
              <div className="font-fjalla-one text">
              {/* Background Image */}
              <Image
                src={`/${slide.image}`}
                alt ={slide.title}
                fill
                className="object-cover font-fjalla-one "
              />
              </div>
              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />

              {/* Text on top of image */}
              <div className="absolute top-0 left-0 h-full w-full flex items-center px-8 z-10">
                <div className="max-w-md text-white space-y-3">
                  <h2 className="text-2xl font-fjalla-one leading-snug">
                    {slide.title}
                  </h2>
                  <p className="text-sm opacity-90">{slide.description}</p>
                  <button className="border-2 border-white text-white font-semibold px-4 py-2 rounded hover:bg-black  hover:scale-105 duration-300 hover:text-white bg-transparent transition">
                    {slide.buttonText}
                  </button>
                </div>
              </div>
              
            </div>
            
          ))}
        </SlickSlider>
      </div>
      
    </div>
  );
};

export default SliderWrapper;
