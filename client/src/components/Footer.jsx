export default function Footer() {

    return (

        <footer
            className="
                bg-blue-950
                text-white
                mt-12
                sm:mt-16
            "
        >


            <div
                className="
                    max-w-7xl
                    mx-auto
                    py-8
                    sm:py-10
                    px-4
                    sm:px-6
                    lg:px-8
                    text-center
                    sm:text-left
                "
            >


                <h2
                    className="
                        text-lg
                        sm:text-xl
                        font-bold
                    "
                >
                    Angels Home Education Centre
                </h2>




                <p
                    className="
                        mt-3
                        text-sm
                        sm:text-base
                        text-gray-200
                        max-w-xl
                    "
                >
                    Empowering young minds through quality education.
                </p>





                <hr
                    className="
                        my-5
                        sm:my-6
                        border-gray-500
                    "
                />





                <p
                    className="
                        text-xs
                        sm:text-sm
                        text-gray-300
                    "
                >
                    © 2026 Angels Home Education Center.
                    <br className="sm:hidden" />
                    {" "}
                    All Rights Reserved.
                </p>



            </div>


        </footer>

    );

}