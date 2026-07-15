import { useState } from "react";

import { useNavigate } from "react-router-dom";



export default function AdminLogin() {


    const navigate =
        useNavigate();


    const [email, setEmail] = useState("");

    const [password, setPassword] = useState("");

    const [error, setError] = useState("");





    async function login(e) {

        e.preventDefault();



        try {


            const response =
                await fetch(

                    "http://localhost:5000/api/admin/login",

                    {

                        method: "POST",

                        headers: {

                            "Content-Type": "application/json"

                        },


                        body: JSON.stringify({

                            email,

                            password

                        })

                    }

                );



            const data =
                await response.json();





            if (data.token) {


                localStorage.setItem(

                    "adminToken",

                    data.token

                );



                navigate("/admin/dashboard");


            }


            else {


                setError(
                    data.message
                );


            }


        }

        catch (error) {


            setError(
                "Login failed"
            );


        }


    }




    return (

        <div className="min-h-screen bg-blue-900 flex items-center justify-center">


            <form

                onSubmit={login}

                className="bg-white rounded-xl shadow-xl p-10 w-full max-w-md"

            >


                <h1 className="text-3xl font-bold text-blue-900">

                    Admin Login

                </h1>




                <input

                    type="email"

                    placeholder="Email"

                    className="w-full border p-3 mt-6 rounded"

                    value={email}

                    onChange={(e) => setEmail(e.target.value)}

                    required

                />




                <input

                    type="password"

                    placeholder="Password"

                    className="w-full border p-3 mt-4 rounded"

                    value={password}

                    onChange={(e) => setPassword(e.target.value)}

                    required

                />





                <button

                    className="w-full bg-blue-900 text-white mt-6 py-3 rounded"

                >

                    Login

                </button>




                {

                    error &&

                    <p className="text-red-600 mt-4">

                        {error}

                    </p>

                }


            </form>


        </div>

    )

}