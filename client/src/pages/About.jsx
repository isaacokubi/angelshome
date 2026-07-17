import StaffCard from "../components/StaffCard";
import Timeline from "../components/Timeline";


export default function About() {

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
About Angels Home Education Centre
</h1>


<p
className="
mt-5
sm:mt-6
text-base
sm:text-lg
lg:text-xl
leading-7
sm:leading-9
max-w-4xl
"
>

We are committed to providing affordable,
quality and holistic education that empowers
every learner to become responsible,
creative and productive members of society.

</p>


</div>

</section>





{/* Our Story */}
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
text-blue-900
"
>
Our Story
</h2>


<p
className="
mt-5
sm:mt-8
text-base
sm:text-lg
leading-7
sm:leading-9
text-gray-700
"
>

Founded with the belief that every child deserves
access to quality education,
Angels Home Education Center has continued
to nurture learners academically,
socially and spiritually.

<br/><br/>

Over the years,
our institution has grown into one of the
most respected community schools,
offering a balanced curriculum,
modern teaching methods
and excellent student support.

</p>


</section>





{/* Mission Vision Values */}
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
lg:text-4xl
font-bold
text-center
mb-8
sm:mb-12
"
>
Mission • Vision • Values
</h2>




<div
className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-3
gap-6
sm:gap-8
"
>




<div
className="
bg-white
rounded-xl
shadow-lg
p-5
sm:p-8
"
>

<h3
className="
text-xl
sm:text-2xl
font-bold
text-blue-900
"
>
Mission
</h3>


<p className="mt-4 text-gray-700 leading-7">

 To provide Christ-centered, quality education and holistic care to orphans and vulnerable children.
</p>


</div>





<div
className="
bg-white
rounded-xl
shadow-lg
p-5
sm:p-8
"
>

<h3
className="
text-xl
sm:text-2xl
font-bold
text-blue-900
"
>
Vision
</h3>


<p className="mt-4 text-gray-700 leading-7">

 To raise God-fearing leaders from the slums who will transform Kenya.
</p>


</div>





<div
className="
bg-white
rounded-xl
shadow-lg
p-5
sm:p-8
"
>

<h3
className="
text-xl
sm:text-2xl
font-bold
text-blue-900
"
>
Core Values
</h3>


<ul
className="
list-disc
ml-5
mt-4
space-y-2
text-gray-700
"
>

<li>Integrity</li>
<li>Excellence</li>
<li>Discipline</li>
<li>Innovation</li>
<li>Respect</li>

</ul>


</div>



</div>


</div>


</section>







{/* Administration */}
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
mb-8
sm:mb-12
"
>
School & Orphanage Board of Directors
</h2>



<div
className="
grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
gap-6
sm:gap-10
"
>


<StaffCard
image="/images/director1.jpg"
name="Rev Josephat Andula Okama"
position="Director"
description="Experienced education leader committed to academic excellence."
/>


<StaffCard
image="/images/"
name="Missionary Martha"
position="Board member"
description="Coordinates orphanage and student welfare."
/>


<StaffCard
image="/images/"
name="Missionary Mary"
position="Board member"
description="Coordinates orphanage and student welfare."
/>


<StaffCard
image="/images/"
name="Pastor Stephen Olumula"
position="Board member"
description="Incharge of home and school infrastructure."
/>


</div>


</section>



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
mb-8
sm:mb-12
"
>
School Staff
</h2>



<div
className="
grid
grid-cols-1
sm:grid-cols-2
lg:grid-cols-3
gap-6
sm:gap-10
"
>


<StaffCard
image="/images/nicholus.png"
name="Mr Nicholus Maleba"
position="Teacher"
description="A committed and focused scholar ."
/>


<StaffCard
image="/images/wilbar.png"
name="Mr Wilberforce Ouma"
position="Teacher"
description="A devoted teacher and a talented instrumentalist for the church."
/>


<StaffCard
image="/images/gabby.png"
name="Mr Gabriel Odhiambo"
position="Teacher"
description="A consistent and loyal worker."
/>



</div>


</section>







{/* Achievements */}
<section
className="
bg-blue-50
py-12
sm:py-16
lg:py-20
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
lg:text-4xl
font-bold
mb-8
sm:mb-12
"
>
School Achievements
</h2>


<Timeline/>


</div>


</section>



</div>

)

}