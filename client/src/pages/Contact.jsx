import ContactForm from "../components/ContactForm";
import SocialLinks from "../components/SocialLinks";

export default function Contact() {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="
bg-blue-900
text-white
py-16
sm:py-20
lg:py-24
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
          <h1
            className="
text-3xl
sm:text-4xl
lg:text-5xl
font-bold
leading-tight
"
          >
            Contact Angels Home Education Centre
          </h1>

          <p
            className="
mt-4
sm:mt-6
text-base
sm:text-lg
lg:text-xl
max-w-3xl
leading-7
"
          >
            We would love to hear from parents, students and partners.
          </p>
        </div>
      </section>

      {/* Contact Content */}
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
        <div
          className="
grid
grid-cols-1
lg:grid-cols-2
gap-8
lg:gap-12
"
        >
          {/* Contact Information */}
          <div>
            <h2
              className="
text-2xl
sm:text-3xl
lg:text-4xl
font-bold
text-blue-900
"
            >
              Get In Touch
            </h2>

            <div
              className="
mt-6
sm:mt-8
space-y-5
sm:space-y-6
"
            >
              <div
                className="
bg-white
shadow-md
rounded-xl
p-5
sm:p-6
"
              >
                <h3
                  className="
font-bold
text-lg
sm:text-xl
text-blue-900
"
                >
                  School Address
                </h3>

                <p
                  className="
mt-2
leading-7
text-gray-700
"
                >
                  Angels Home Education Center
                  <br />
                  P.O Box 225-00510
                  <br />
                  Nairobi, Kenya
                </p>
              </div>

              <div
                className="
bg-white
shadow-md
rounded-xl
p-5
sm:p-6
"
              >
                <h3
                  className="
font-bold
text-lg
sm:text-xl
text-blue-900
"
                >
                  Phone
                </h3>

                <p className="mt-2 text-gray-700">+254 725481011</p>
              </div>

              <div
                className="
bg-white
shadow-md
rounded-xl
p-5
sm:p-6
"
              >
                <h3
                  className="
font-bold
text-lg
sm:text-xl
text-blue-900
"
                >
                  Email
                </h3>

                <p className="mt-2 text-gray-700 break-words">
                  angelshomecentre@gmail.com
                </p>
              </div>
            </div>

            <div className="mt-8">
              <SocialLinks />
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Google Map */}
     <section
  className="
    h-[300px]
    sm:h-[400px]
    lg:h-[450px]
  "
>
  <iframe
    title="school location"
    className="
      w-full
      h-full
      border-0
    "
    src="https://www.google.com/maps?q=-1.2635235,36.8578211&hl=en&z=17&output=embed"
    loading="lazy"
    allowFullScreen
    referrerPolicy="no-referrer-when-downgrade"
  ></iframe>
</section>
    </div>
  );
}
