import HeroSlider from "../components/HeroSlider";
import ProgressBar from "../components/ProgressBar";
import LatestNews from "../components/LatestNews";


export default function Home() {

  return (

    <>

      {/* Hero Section */}
      <HeroSlider />



      {/* Welcome Message */}
      <section
        className="
          max-w-7xl
          mx-auto
          py-12
          sm:py-16
          lg:py-20
          px-4
          sm:px-6
          lg:px-8
        "
      >

        <h2
          className="
            text-2xl
            sm:text-3xl
            md:text-4xl
            font-bold
            text-blue-900
          "
        >
          Welcome Message
        </h2>


        <p
          className="
            mt-5
            sm:mt-6
            text-base
            sm:text-lg
            leading-7
            sm:leading-9
            text-gray-700
            max-w-4xl
          "
        >

          Welcome to Angels Home Education Center.

          <br />

          We are committed to nurturing learners academically,
          spiritually and socially in a caring environment.

          <br />

          Our mission is to inspire excellence,
          discipline,
          innovation and lifelong learning.

        </p>


      </section>





      {/* Quick Links Section */}
      <section
        className="
          bg-slate-100
          py-12
          sm:py-16
          lg:py-20
        "
      >


        <div
          className="
            max-w-7xl
            mx-auto
            px-4
            sm:px-6
            lg:px-8
          "
        >



          <h2
            className="
              text-2xl
              sm:text-3xl
              md:text-4xl
              font-bold
              text-center
              mb-8
              sm:mb-10
              text-blue-900
            "
          >
            Quick Links
          </h2>





          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              lg:grid-cols-3
              gap-6
              sm:gap-8
            "
          >



            {/* Card 1 */}
            <div
              className="
                bg-white
                p-5
                sm:p-8
                rounded-xl
                shadow
                hover:shadow-lg
                transition
              "
            >

              <h3
                className="
                  font-bold
                  text-xl
                  sm:text-2xl
                  text-blue-900
                "
              >
                Parent Portal
              </h3>


              <p
                className="
                  mt-3
                  sm:mt-4
                  text-gray-600
                  leading-7
                "
              >
                Access student reports and fee statements.
              </p>


            </div>





            {/* Card 2 */}
            <div
              className="
                bg-white
                p-5
                sm:p-8
                rounded-xl
                shadow
                hover:shadow-lg
                transition
              "
            >

              <h3
                className="
                  font-bold
                  text-xl
                  sm:text-2xl
                  text-blue-900
                "
              >
                School Calendar
              </h3>


              <p
                className="
                  mt-3
                  sm:mt-4
                  text-gray-600
                  leading-7
                "
              >
                View upcoming school activities.
              </p>


            </div>





            {/* Card 3 */}
            <div
              className="
                bg-white
                p-5
                sm:p-8
                rounded-xl
                shadow
                hover:shadow-lg
                transition
              "
            >

              <h3
                className="
                  font-bold
                  text-xl
                  sm:text-2xl
                  text-blue-900
                "
              >
                Latest News
              </h3>


              <p
                className="
                  mt-3
                  sm:mt-4
                  text-gray-600
                  leading-7
                "
              >
                Stay informed with announcements.
              </p>


            </div>



          </div>


        </div>


      </section>





      {/* News Section */}
      <LatestNews />





      {/* Progress Section */}
      <section
        className="
          max-w-7xl
          mx-auto
          py-12
          sm:py-16
          lg:py-20
          px-4
          sm:px-6
          lg:px-8
        "
      >

        <ProgressBar />

      </section>



    </>

  );

}