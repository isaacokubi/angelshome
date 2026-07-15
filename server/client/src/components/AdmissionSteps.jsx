const steps = [

    {
        number: "01",
        title: "Submit Application",
        description:
            "Parents complete and submit the admission application form."
    },

    {
        number: "02",
        title: "Assessment & Interview",
        description:
            "The learner attends an assessment and admission interview."
    },

    {
        number: "03",
        title: "Admission Approval",
        description:
            "Successful applicants receive an admission confirmation letter."
    },

    {
        number: "04",
        title: "Reporting & Orientation",
        description:
            "Students report and begin their learning journey."
    }

];


export default function AdmissionSteps() {

    return (

        <div className="grid md:grid-cols-4 gap-6">

            {
                steps.map((step, index) => (

                    <div
                        key={index}
                        className="bg-white rounded-xl shadow-lg p-6 text-center"
                    >

                        <div className="bg-blue-900 text-white w-16 h-16 rounded-full flex items-center justify-center mx-auto text-xl font-bold">

                            {step.number}

                        </div>


                        <h3 className="text-xl font-bold mt-6">

                            {step.title}

                        </h3>


                        <p className="mt-4 text-gray-600">

                            {step.description}

                        </p>


                    </div>

                ))
            }

        </div>

    )

}