export default function FundraisingCard({
    title,
    description,
    amount,
    icon
}) {

    return (

        <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-2xl transition">


            <div className="text-5xl">

                {icon}

            </div>


            <h3 className="text-2xl font-bold text-blue-900 mt-5">

                {title}

            </h3>


            <p className="mt-4 text-gray-600">

                {description}

            </p>


            <p className="mt-6 font-bold text-green-700">

                Target: {amount}

            </p>


        </div>

    )

}