export default function StaffCard({
    image,
    name,
    position,
    description
}) {

    return (

        <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition duration-300">

            {/* Image container */}
            <div className="w-full h-96 bg-gray-100 flex items-center justify-center">

                <img
                    src={image}
                    alt={name}
                    className="w-full h-full object-contain"
                    loading="lazy"
                />

            </div>


            <div className="p-6">

                <h3 className="text-2xl font-bold text-blue-900">
                    {name}
                </h3>


                <p className="text-green-700 font-semibold mt-2">
                    {position}
                </p>


                <p className="mt-4 text-gray-600 leading-7">
                    {description}
                </p>

            </div>

        </div>

    );

}