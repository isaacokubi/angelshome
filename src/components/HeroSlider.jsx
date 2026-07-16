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

    <section 
      className="
        relative 
        h-[70vh] 
        sm:h-[80vh] 
        lg:h-screen 
        overflow-hidden
      "
    >

      {slides.map((slide, index) => (

        <div
          key={index}
          className={`
            absolute 
            inset-0 
            transition-opacity 
            duration-1000
            ${
              current === index 
              ? "opacity-100" 
              : "opacity-0"
            }
          `}
        >


          {/* Background Image */}
          <img
            src={slide.image}
            alt={slide.title}
            className="
              w-full 
              h-full 
              object-cover
              object-center
            "
          />


          {/* Overlay */}
          <div
            className="
              absolute 
              inset-0 
              bg-black/60
              flex 
              items-center 
              justify-center
            "
          >


            <div
              className="
                text-center 
                text-white 
                px-4
                sm:px-8
                max-w-5xl
              "
            >


              <h1
                className="
                  text-3xl
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                  font-bold
                  leading-tight
                  mb-4
                "
              >
                {slide.title}
              </h1>



              <p
                className="
                  text-base
                  sm:text-lg
                  md:text-xl
                  lg:text-2xl
                  mb-6
                  sm:mb-8
                "
              >
                {slide.subtitle}
              </p>




              <button
                onClick={handleDonate}
                className="
                  bg-yellow-500
                  hover:bg-yellow-600
                  text-black
                  font-bold
                  px-6
                  py-3
                  sm:px-8
                  sm:py-4
                  rounded-lg
                  text-sm
                  sm:text-base
                  transition
                "
              >
                Donate Now
              </button>


            </div>


          </div>


        </div>

      ))}


      {/* Slider Indicators */}
      <div
        className="
          absolute
          bottom-6
          left-0
          right-0
          flex
          justify-center
          gap-3
        "
      >

        {slides.map((_, index)=>(

          <button
            key={index}
            onClick={()=>setCurrent(index)}
            className={`
              w-3
              h-3
              rounded-full
              ${
                current === index
                ? "bg-yellow-400"
                : "bg-white/50"
              }
            `}
          />

        ))}

      </div>


    </section>

  );
}