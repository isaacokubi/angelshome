import { useEffect, useState } from "react";


export default function LatestNews() {


    const [news, setNews] = useState([]);



    useEffect(() => {

        fetch(
            "http://localhost:5000/api/admin/announcements"
        )
        .then(res => res.json())
        .then(data => setNews(data))
        .catch(err => console.log(err));


    }, []);





    return (

        <section
            className="
                py-12
                sm:py-16
                lg:py-20
                bg-gray-50
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
                        text-blue-900
                    "
                >
                    Latest School Announcements
                </h2>





                {
                    news.length === 0 ? (

                        <p
                            className="
                                text-center
                                mt-8
                                text-gray-500
                            "
                        >
                            No announcements available.
                        </p>

                    ) : (


                        <div
                            className="
                                grid
                                grid-cols-1
                                sm:grid-cols-2
                                lg:grid-cols-3
                                gap-6
                                sm:gap-8
                                mt-8
                                sm:mt-10
                            "
                        >



                            {
                                news.map(

                                    (item, index) => (

                                        <div

                                            key={index}

                                            className="
                                                bg-white
                                                shadow-md
                                                rounded-xl
                                                p-5
                                                sm:p-6
                                                hover:shadow-xl
                                                transition
                                                flex
                                                flex-col
                                            "

                                        >



                                            <h3

                                                className="
                                                    text-lg
                                                    sm:text-xl
                                                    font-bold
                                                    text-blue-900
                                                    break-words
                                                "

                                            >

                                                {item.title}

                                            </h3>





                                            <p

                                                className="
                                                    mt-3
                                                    sm:mt-4
                                                    text-gray-700
                                                    leading-7
                                                    text-sm
                                                    sm:text-base
                                                    flex-grow
                                                "

                                            >

                                                {item.content}

                                            </p>






                                            <p

                                                className="
                                                    text-xs
                                                    sm:text-sm
                                                    text-gray-500
                                                    mt-4
                                                "

                                            >

                                                {
                                                    new Date(
                                                        item.date
                                                    ).toDateString()
                                                }

                                            </p>




                                        </div>


                                    )

                                )

                            }



                        </div>


                    )

                }




            </div>


        </section>

    );

}