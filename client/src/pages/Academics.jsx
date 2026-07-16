
import AdmissionSteps from "../components/AdmissionSteps";
import SchoolCalendar from "../components/SchoolCalendar";


export default function Academics() {


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

Academics & Admissions

</h1>


<p
className="
mt-4
sm:mt-6
text-base
sm:text-lg
lg:text-xl
"
>

Building knowledge, creativity and character.

</p>


</div>

</section>







{/* Curriculum Section */}
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

Our Curriculum

</h2>



<p
className="
mt-4
sm:mt-5
leading-7
sm:leading-8
text-gray-700
"
>

Angels Home Education Center follows a balanced
curriculum designed to develop academic,
creative and practical skills.

</p>





<div
className="
grid
grid-cols-1
md:grid-cols-2
lg:grid-cols-3
gap-6
sm:gap-8
mt-8
sm:mt-10
"
>





<div
className="
bg-white
shadow-lg
rounded-xl
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

Lower Primary

</h3>


<ul
className="
mt-4
space-y-3
text-gray-700
"
>

<li>English</li>
<li>Mathematics</li>
<li>Environmental Activities</li>
<li>Creative Arts</li>
<li>Religious Education</li>

</ul>


</div>







<div
className="
bg-white
shadow-lg
rounded-xl
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

Upper Primary

</h3>


<ul
className="
mt-4
space-y-3
text-gray-700
"
>

<li>English</li>
<li>Kiswahili</li>
<li>Science</li>
<li>Social Studies</li>
<li>Computer Studies</li>

</ul>


</div>








<div
className="
bg-white
shadow-lg
rounded-xl
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

Extra Programmes

</h3>


<ul
className="
mt-4
space-y-3
text-gray-700
"
>

<li>Football</li>
<li>Music</li>
<li>Debate Club</li>
<li>Robotics</li>
<li>Swimming</li>

</ul>


</div>





</div>


</section>








{/* Admission Process */}
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
mb-8
sm:mb-12
"
>

Admission Process

</h2>



<AdmissionSteps/>





<div
className="
mt-10
sm:mt-12
"
>


<a

href="/documents/admission-form.pdf"

download

className="
inline-block
bg-yellow-500
hover:bg-yellow-600
px-5
sm:px-8
py-3
sm:py-4
rounded-lg
font-bold
text-sm
sm:text-base
transition
"

>

Download Admission Form

</a>


</div>



</div>


</section>








{/* Fees Structure */}
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
"
>

School Fees Structure

</h2>





<div
className="
overflow-x-auto
mt-6
sm:mt-8
"
>


<table
className="
w-full
min-w-[600px]
bg-white
shadow-lg
rounded-lg
overflow-hidden
"
>


<thead
className="
bg-blue-900
text-white
"
>


<tr>

<th className="p-3 sm:p-4">
Class
</th>

<th className="p-3 sm:p-4">
Term Fees
</th>

<th className="p-3 sm:p-4">
Transport
</th>


</tr>


</thead>



<tbody>


<tr>

<td className="p-3 sm:p-4 border">
Grade 1-3
</td>

<td className="p-3 sm:p-4 border">
KES 25,000
</td>

<td className="p-3 sm:p-4 border">
KES 5,000
</td>

</tr>




<tr>

<td className="p-3 sm:p-4 border">
Grade 4-6
</td>

<td className="p-3 sm:p-4 border">
KES 30,000
</td>

<td className="p-3 sm:p-4 border">
KES 5,000
</td>

</tr>



</tbody>


</table>


</div>


</section>








{/* Calendar */}
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

<SchoolCalendar/>


</div>


</section>





</div>

)

}