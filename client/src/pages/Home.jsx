import HeroSlider from "../components/HeroSlider";
import ProgressBar from "../components/ProgressBar";

import LatestNews
  from "../components/LatestNews";

export default function Home() {
  return (
    <>
      <HeroSlider />

      <section className="max-w-7xl mx-auto py-20 px-6">

        <h2 className="text-4xl font-bold text-blue-900">
          Welcome Message
        </h2>

        <p className="mt-6 text-lg leading-9">
          Welcome to Angels Home Education Center.

          We are committed to nurturing learners academically,
          spiritually and socially in a caring environment.

          Our mission is to inspire excellence,
          discipline,
          innovation and lifelong learning.
        </p>

      </section>

      <section className="bg-slate-100 py-20">

        <div className="max-w-7xl mx-auto px-6">

          <h2 className="text-4xl font-bold text-center mb-10">
            Quick Links
          </h2>


          <div className="grid md:grid-cols-3 gap-8">

            <div className="bg-white p-8 rounded-xl shadow">
              <h3 className="font-bold text-2xl">
                Parent Portal
              </h3>

              <p className="mt-4">
                Access student reports and fee statements.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow">
              <h3 className="font-bold text-2xl">
                School Calendar
              </h3>

              <p className="mt-4">
                View upcoming school activities.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow">
              <h3 className="font-bold text-2xl">
                Latest News
              </h3>

              <p className="mt-4">
                Stay informed with announcements.
              </p>
            </div>

          </div>

        </div>

      </section>


      <LatestNews />

      <section className="max-w-7xl mx-auto py-20 px-6">
        <ProgressBar />
      </section>

    </>
  );
}