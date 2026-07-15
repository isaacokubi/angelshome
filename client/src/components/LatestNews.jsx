import {
    useEffect,
    useState
}
    from "react";



export default function LatestNews() {


    const [news, setNews] = useState([]);





    useEffect(() => {


        fetch(

            "http://localhost:5000/api/admin/announcements"

        )

            .then(res => res.json())

            .then(data => setNews(data));


    }, []);





    return (

        <section className="py-20">


            <h2 className="text-4xl font-bold text-center text-blue-900">

                Latest School Announcements

            </h2>





            <div className="grid md:grid-cols-3 gap-8 mt-10">


                {

                    news.map(

                        (item, index) => (


                            <div

                                key={index}

                                className="bg-white shadow rounded-xl p-6"

                            >


                                <h3 className="text-xl font-bold">

                                    {item.title}

                                </h3>


                                <p className="mt-4">

                                    {item.content}

                                </p>


                                <p className="text-sm text-gray-500 mt-4">

                                    {new Date(item.date).toDateString()}

                                </p>


                            </div>


                        )

                    )


                }


            </div>


        </section>

    )

}