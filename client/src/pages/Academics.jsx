import AdmissionSteps from "../components/AdmissionSteps";
import SchoolCalendar from "../components/SchoolCalendar";


export default function Academics(){


return(


<div>



<section className="bg-blue-900 text-white py-24">


<div className="max-w-7xl mx-auto px-6">


<h1 className="text-5xl font-bold">

Academics & Admissions

</h1>


<p className="mt-6 text-xl">

Building knowledge, creativity and character.

</p>


</div>


</section>





<section className="max-w-7xl mx-auto py-20 px-6">


<h2 className="text-4xl font-bold text-blue-900">

Our Curriculum

</h2>


<p className="mt-5 leading-8">

Angels Home Education Center follows a balanced
curriculum designed to develop academic,
creative and practical skills.


</p>



<div className="grid md:grid-cols-3 gap-8 mt-10">



<div className="bg-white shadow rounded-xl p-8">


<h3 className="text-2xl font-bold">

Lower Primary

</h3>


<ul className="mt-5 space-y-3">


<li>English</li>

<li>Mathematics</li>

<li>Environmental Activities</li>

<li>Creative Arts</li>

<li>Religious Education</li>


</ul>


</div>





<div className="bg-white shadow rounded-xl p-8">


<h3 className="text-2xl font-bold">

Upper Primary

</h3>


<ul className="mt-5 space-y-3">


<li>English</li>

<li>Kiswahili</li>

<li>Science</li>

<li>Social Studies</li>

<li>Computer Studies</li>


</ul>


</div>





<div className="bg-white shadow rounded-xl p-8">


<h3 className="text-2xl font-bold">

Extra Programmes

</h3>


<ul className="mt-5 space-y-3">


<li>Football</li>

<li>Music</li>

<li>Debate Club</li>

<li>Robotics</li>

<li>Swimming</li>


</ul>


</div>



</div>



</section>







<section className="bg-slate-100 py-20">


<div className="max-w-7xl mx-auto px-6">


<h2 className="text-4xl font-bold mb-12">

Admission Process

</h2>


<AdmissionSteps/>


<div className="mt-12">


<a

href="/documents/admission-form.pdf"

download

className="bg-yellow-500 px-8 py-4 rounded-lg font-bold"

>

Download Admission Form

</a>


</div>


</div>


</section>









<section className="max-w-7xl mx-auto py-20 px-6">


<h2 className="text-4xl font-bold">

School Fees Structure

</h2>



<div className="overflow-x-auto mt-8">


<table className="w-full bg-white shadow rounded-lg">


<thead className="bg-blue-900 text-white">


<tr>

<th className="p-4">
Class
</th>


<th className="p-4">
Term Fees
</th>


<th className="p-4">
Transport
</th>


</tr>


</thead>



<tbody>


<tr>

<td className="p-4 border">
Grade 1-3
</td>


<td className="p-4 border">
KES 25,000
</td>


<td className="p-4 border">
KES 5,000
</td>


</tr>



<tr>

<td className="p-4 border">
Grade 4-6
</td>


<td className="p-4 border">
KES 30,000
</td>


<td className="p-4 border">
KES 5,000
</td>


</tr>



</tbody>



</table>


</div>


</section>








<section className="bg-blue-50 py-20">


<div className="max-w-7xl mx-auto px-6">


<SchoolCalendar/>


</div>


</section>



</div>


)

}