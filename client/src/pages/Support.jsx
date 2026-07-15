import FundraisingCard from "../components/FundraisingCard";
import DonationForm from "../components/DonationForm";
import TransparencyTracker from "../components/TransparencyTracker";


export default function Support() {


    return (

        <div>


            <section className="bg-blue-900 text-white py-24">


                <div className="max-w-7xl mx-auto px-6">


                    <h1 className="text-5xl font-bold">

                        Support Our Mission

                    </h1>


                    <p className="mt-6 text-xl">

                        Help us provide better learning facilities
                        for our students.

                    </p>


                </div>


            </section>






            <section className="max-w-7xl mx-auto py-20 px-6">


                <h2 className="text-4xl font-bold text-center">

                    Where Your Support Goes

                </h2>



                <div className="grid md:grid-cols-3 gap-8 mt-12">



                    <FundraisingCard

                        icon="🏫"

                        title="Infrastructure"

                        description="Classrooms, laboratories and learning facilities."

                        amount="KES 5,000,000"

                    />



                    <FundraisingCard

                        icon="🎓"

                        title="Scholarship Fund"

                        description="Supporting talented students from disadvantaged families."

                        amount="KES 2,000,000"

                    />



                    <FundraisingCard

                        icon="⚽"

                        title="Sports Equipment"

                        description="Providing equipment for student activities."

                        amount="KES 1,000,000"

                    />



                </div>


            </section>







            <section className="bg-slate-100 py-20">


                <div className="max-w-xl mx-auto px-6">


                    <DonationForm />


                </div>


            </section>







            <section className="max-w-5xl mx-auto py-20 px-6">


                <TransparencyTracker />


            </section>



        </div>


    )

}