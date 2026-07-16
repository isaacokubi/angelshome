import { useState } from "react";


export default function AnnouncementForm() {


    const [title, setTitle] = useState("");

    const [content, setContent] = useState("");

    const [message, setMessage] = useState("");





    async function submit(e) {


        e.preventDefault();



        const token =
            localStorage.getItem(
                "adminToken"
            );




        const response =
            await fetch(

                "https://angelshome-1.onrender.com/api/admin/announcement",

                {


                    method: "POST",


                    headers: {

                        "Content-Type": "application/json",


                        Authorization:

                            `Bearer ${token}`

                    },


                    body: JSON.stringify({

                        title,

                        content

                    })


                }

            );




        const data =
            await response.json();



        setMessage(
            data.message
        );



        setTitle("");

        setContent("");

    }





    return (

        <form

            onSubmit={submit}

            className="bg-white shadow rounded-xl p-8 mt-10"

        >


            <h2 className="text-3xl font-bold text-blue-900">

                Publish Announcement

            </h2>




            <input

                className="w-full border p-3 mt-6 rounded"

                placeholder="Announcement title"

                value={title}

                onChange={(e) => setTitle(e.target.value)}

                required

            />





            <textarea

                className="w-full border p-3 mt-4 rounded"

                rows="5"

                placeholder="Announcement details"

                value={content}

                onChange={(e) => setContent(e.target.value)}

                required

            />





            <button

                className="bg-blue-900 text-white px-8 py-3 rounded mt-5"

            >

                Publish

            </button>



            {

                message &&

                <p className="mt-4 text-green-700">

                    {message}

                </p>

            }


        </form>

    )

}