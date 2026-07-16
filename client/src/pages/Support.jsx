import FundraisingCard from "../components/FundraisingCard";
import DonationForm from "../components/DonationForm";
import TransparencyTracker from "../components/TransparencyTracker";


export default function Support() {


return (

<div>


{/* Hero Section */}
<section
className="
bg-blue-900
text-white
py-16
sm:py-20
lg:py-24
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


<h1
className="
text-3xl
sm:text-4xl
lg:text-5xl
font-bold
leading-tight
"
>

Support Our Mission

</h1>



<p
className="
mt-4
sm:mt-6
text-base
sm:text-lg
lg:text-xl
max-w-3xl
leading-7
"
>

Help us provide better learning facilities
for our students.

</p>


</div>


</section>







{/* Fundraising Areas */}
<section
className="
max-w-7xl
mx-auto
py-12
sm:py-16
lg:py-20
px-4
sm:px-6
lg:px-8
"
>



<h2
className="
text-2xl
sm:text-3xl
lg:text-4xl
font-bold
text-center
text-blue-900
"
>

Where Your Support Goes

</h2>





<div
className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-3
gap-6
sm:gap-8
mt-8
sm:mt-12
"
>



<FundraisingCard

icon="🏫"

title="Infrastructure"

description="Classrooms, laboratories and learning facilities."

amount="KES 5,000,000"

/>





<FundraisingCard

icon="🎓"

title="Scholarship Fund"

description="Supporting talented students from disadvantaged families."

amount="KES 2,000,000"

/>





<FundraisingCard

icon="⚽"

title="Sports Equipment"

description="Providing equipment for student activities."

amount="KES 1,000,000"

/>



</div>


</section>








{/* Donation Form */}
<section
className="
bg-slate-100
py-12
sm:py-16
lg:py-20
"
>


<div
className="
max-w-xl
mx-auto
px-4
sm:px-6
lg:px-8
"
>


<DonationForm/>


</div>


</section>







{/* Transparency */}
<section
className="
max-w-5xl
mx-auto
py-12
sm:py-16
lg:py-20
px-4
sm:px-6
lg:px-8
"
>


<TransparencyTracker/>


</section>



</div>

)

}