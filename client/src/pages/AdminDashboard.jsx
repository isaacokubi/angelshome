import {
    useEffect,
    useState
}
    from "react";


import AnnouncementForm
    from "../components/AnnouncementForm";


export default function AdminDashboard() {


    const [data, setData] = useState(null);



    useEffect(() => {


        loadDashboard();


    }, []);






    async function loadDashboard() {


        const token =
            localStorage.getItem(
                "adminToken"
            );



        const response =
            await fetch(

                "https://angelshome-1.onrender.com/api/admin/dashboard",

                {

                    headers: {

                        Authorization:
                            `Bearer ${token}`

                    }

                }

            );



        const result =
            await response.json();


        setData(result);


    }







    if (!data) {


        return (

            <div className="p-10">

                Loading Dashboard...

            </div>

        )

    }






    return (

        <div className="bg-gray-100 min-h-screen p-8">



            <h1 className="text-4xl font-bold text-blue-900">

                School Administration Dashboard

            </h1>





            <div className="grid md:grid-cols-2 gap-8 mt-10">



                <div className="bg-white shadow rounded-xl p-8">

                    <h2 className="text-xl">

                        Total Donations

                    </h2>


                    <p className="text-4xl font-bold text-green-600">

                        {data.totalDonations}

                    </p>


                </div>






                <div className="bg-white shadow rounded-xl p-8">


                    <h2 className="text-xl">

                        Parent Messages

                    </h2>


                    <p className="text-4xl font-bold text-blue-600">

                        {data.totalMessages}

                    </p>


                </div>


            </div>








            <section className="mt-12 bg-white rounded-xl shadow p-8">


                <h2 className="text-3xl font-bold">

                    Recent Donations

                </h2>



                <div className="overflow-x-auto">


                    <table className="w-full mt-6">


                        <thead className="bg-blue-900 text-white">


                            <tr>

                                <th className="p-3">

                                    Phone

                                </th>


                                <th>

                                    Amount

                                </th>


                                <th>

                                    Status

                                </th>


                            </tr>


                        </thead>





                        <tbody>


                            {

                                data.donations.map(

                                    (donation, index) => (


                                        <tr

                                            key={index}

                                            className="border-b"

                                        >


                                            <td className="p-3">

                                                {donation.phone}

                                            </td>


                                            <td>

                                                KES {donation.amount}

                                            </td>


                                            <td>

                                                {donation.status}

                                            </td>


                                        </tr>


                                    )

                                )


                            }



                        </tbody>



                    </table>


                </div>


            </section>









            <section className="mt-12 bg-white rounded-xl shadow p-8">


                <h2 className="text-3xl font-bold">

                    Parent Messages

                </h2>



                {

                    data.messages.map(

                        (message, index) => (


                            <div

                                key={index}

                                className="border-b py-5"

                            >


                                <h3 className="font-bold">

                                    {message.name}

                                </h3>



                                <p>

                                    {message.message}

                                </p>



                            </div>


                        )


                    )

                }



            </section>


            <AnnouncementForm />
        </div>


    )

}