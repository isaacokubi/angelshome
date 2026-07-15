import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    image: "/images/slide1.jpg",
    title: "Welcome to Angels Home Education Center",
    subtitle: "Providing Quality Education for Every Child",
  },
  {
    image: "/images/slide2.jpg",
    title: "Building Future Leaders",
    subtitle: "Academic Excellence • Discipline • Integrity",
  },
  {
    image: "/images/banner3.jpg",
    title: "Support Our Mission",
    subtitle: "Every Donation Changes a Child's Future",
  },
];

export default function HeroSlider() {
  const [current, setCurrent] = useState(0);

  const navigate = useNavigate();

  function handleDonate() {
    navigate("/donations");
  }

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  return (
    <section className="relative h-[100vh] overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            current === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
            <div className="text-center text-white px-5">
              <h1 className="text-5xl font-bold mb-4">
                {slide.title}
              </h1>

              <p className="text-xl mb-8">
                {slide.subtitle}
              </p>

              <button
                onClick={handleDonate}
                className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-4 rounded-lg transition"
              >
                Donate Now
              </button>
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}