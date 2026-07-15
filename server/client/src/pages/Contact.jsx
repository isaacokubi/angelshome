import ContactForm from "../components/ContactForm";
import SocialLinks from "../components/SocialLinks";


export default function Contact() {


    return (

        <div>


            <section className="bg-blue-900 text-white py-24">


                <div className="max-w-7xl mx-auto px-6">


                    <h1 className="text-5xl font-bold">

                        Contact Angels Home Education Center

                    </h1>


                    <p className="mt-6 text-xl">

                        We would love to hear from parents,
                        students and partners.

                    </p>


                </div>


            </section>







            <section className="max-w-7xl mx-auto py-20 px-6">


                <div className="grid lg:grid-cols-2 gap-12">



                    <div>


                        <h2 className="text-4xl font-bold text-blue-900">

                            Get In Touch

                        </h2>




                        <div className="mt-8 space-y-6">



                            <div className="bg-white shadow rounded-xl p-6">

                                <h3 className="font-bold text-xl">

                                    School Address

                                </h3>


                                <p className="mt-2">

                                    Angels Home Education Center

                                    P.O Box 00000

                                    Nairobi, Kenya

                                </p>

                            </div>





                            <div className="bg-white shadow rounded-xl p-6">


                                <h3 className="font-bold text-xl">

                                    Phone

                                </h3>


                                <p>

                                    +254 700 000000

                                </p>


                            </div>





                            <div className="bg-white shadow rounded-xl p-6">


                                <h3 className="font-bold text-xl">

                                    Email

                                </h3>


                                <p>

                                    info@angelshome.ac.ke

                                </p>


                            </div>



                        </div>



                        <SocialLinks />


                    </div>







                    <ContactForm />



                </div>


            </section>







            <section className="h-[450px]">


                <iframe

                    title="school location"

                    className="w-full h-full"

                    src="https://maps.google.com/maps?q=Nairobi%20Kenya&t=&z=13&ie=UTF8&iwloc=&output=embed"

                    loading="lazy"

                ></iframe>


            </section>






        </div>


    )

}