import { useEffect, useState } from "react";


export default function ProgressBar() {

  const goal = 18500000;
  const raised = 0;


  const percentage = Math.floor(
    (raised / goal) * 100
  );


  const [width, setWidth] = useState(0);



  useEffect(() => {

    const timer = setTimeout(() => {

      setWidth(percentage);

    }, 500);


    return () => clearTimeout(timer);

  }, [percentage]);





  return (

    <div
      className="
        bg-white
        rounded-xl
        shadow-lg
        p-5
        sm:p-6
        md:p-8
        w-full
      "
    >



      <h2
        className="
          text-2xl
          sm:text-3xl
          font-bold
          text-blue-900
        "
      >
        School Development Fund
      </h2>




      <div
        className="
          mt-4
          space-y-2
          text-sm
          sm:text-base
          text-gray-700
        "
      >

        <p>
          Goal:
          <span className="font-semibold">
            {" "}
            KES {goal.toLocaleString()}
          </span>
        </p>


        <p>
          Raised:
          <span className="font-semibold">
            {" "}
            KES {raised.toLocaleString()}
          </span>
        </p>


      </div>





      {/* Progress Track */}
      <div
        className="
          mt-6
          h-4
          sm:h-5
          md:h-6
          bg-gray-200
          rounded-full
          overflow-hidden
        "
      >

        <div

          style={{
            width: `${width}%`
          }}

          className="
            bg-green-600
            h-full
            rounded-full
            transition-all
            duration-[2500ms]
          "

        ></div>


      </div>






      <h3

        className="
          mt-4
          text-lg
          sm:text-xl
          font-bold
          text-gray-800
        "

      >

        {percentage}% Completed

      </h3>



    </div>

  );

}