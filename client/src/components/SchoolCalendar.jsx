import { useState } from "react";


const events = [

    {
        date: "15 August 2026",
        title: "Term Opening Day"
    },

    {
        date: "10 September 2026",
        title: "Mid-Term Examination"
    },

    {
        date: "25 October 2026",
        title: "Sports Day"
    },

    {
        date: "5 December 2026",
        title: "Closing Day"
    }

];


export default function SchoolCalendar() {

    const [selected, setSelected] = useState(null);


    return (

        <div className="bg-white rounded-xl shadow-lg p-8">


            <h2 className="text-3xl font-bold text-blue-900 mb-8">

                Upcoming Events

            </h2>



            <div className="space-y-5">


                {
                    events.map((event, index) => (


                        <button

                            key={index}

                            onClick={() => setSelected(event)}

                            className="w-full text-left bg-blue-50 hover:bg-blue-100 p-5 rounded-lg"

                        >


                            <h3 className="font-bold text-xl">

                                {event.title}

                            </h3>


                            <p className="text-gray-600">

                                {event.date}

                            </p>


                        </button>


                    ))
                }


            </div>



            {
                selected &&

                <div className="mt-8 bg-green-100 p-5 rounded-lg">

                    <h3 className="font-bold">

                        Selected Event

                    </h3>


                    <p>

                        {selected.title}

                    </p>


                    <p>

                        {selected.date}

                    </p>


                </div>

            }



        </div>

    )

}