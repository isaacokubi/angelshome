const timeline = [

    {
        year:"2008",
        title:"School Founded",
        description:"Angels Home Education Center officially opened its doors."
    },

    {
        year:"2015",
        title:"KCPE Excellence",
        description:"Achieved our first county top-performing students."
    },



    {
        year:"2021",
        title:"Sports Champions",
        description:"Won regional football and athletics championships."
    },

    {
        year:"2024",
        title:"STEM Expansion",
        description:"Introduced robotics and coding programmes."
    }

];

export default function Timeline(){

    return(

        <div className="space-y-10">

            {timeline.map((item,index)=>(

                <div
                    key={index}
                    className="flex gap-8"
                >

                    <div className="w-32 font-bold text-yellow-600 text-xl">
                        {item.year}
                    </div>

                    <div className="border-l-4 border-blue-800 pl-8">

                        <h3 className="text-2xl font-bold">
                            {item.title}
                        </h3>

                        <p className="mt-3 text-gray-600">
                            {item.description}
                        </p>

                    </div>

                </div>

            ))}

        </div>

    )

}