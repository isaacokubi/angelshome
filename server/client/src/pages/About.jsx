import StaffCard from "../components/StaffCard";
import Timeline from "../components/Timeline";

export default function About(){

return(

<div>

<section className="bg-blue-900 text-white py-24">

<div className="max-w-7xl mx-auto px-6">

<h1 className="text-5xl font-bold">

About Angels Home Education Center

</h1>

<p className="mt-6 text-xl leading-9">

We are committed to providing affordable,
quality and holistic education that empowers
every learner to become responsible,
creative and productive members of society.

</p>

</div>

</section>

<section className="max-w-7xl mx-auto py-20 px-6">

<h2 className="text-4xl font-bold text-blue-900">

Our Story

</h2>

<p className="mt-8 leading-9 text-lg">

Founded with the belief that every child deserves
access to quality education,
Angels Home Education Center has continued
to nurture learners academically,
socially and spiritually.

Over the years,
our institution has grown into one of the
most respected community schools,
offering a balanced curriculum,
modern teaching methods
and excellent student support.

</p>

</section>

<section className="bg-slate-100 py-20">

<div className="max-w-7xl mx-auto px-6">

<h2 className="text-4xl font-bold text-center mb-12">

Mission • Vision • Values

</h2>

<div className="grid md:grid-cols-3 gap-8">

<div className="bg-white rounded-xl shadow-lg p-8">

<h3 className="text-2xl font-bold text-blue-900">

Mission

</h3>

<p className="mt-5">

To provide quality,
inclusive and affordable education
that develops responsible citizens.

</p>

</div>

<div className="bg-white rounded-xl shadow-lg p-8">

<h3 className="text-2xl font-bold text-blue-900">

Vision

</h3>

<p className="mt-5">

To become a centre of excellence
in holistic education.

</p>

</div>

<div className="bg-white rounded-xl shadow-lg p-8">

<h3 className="text-2xl font-bold text-blue-900">

Core Values

</h3>

<ul className="list-disc ml-5 mt-4 space-y-2">

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

<section className="max-w-7xl mx-auto py-20 px-6">

<h2 className="text-4xl font-bold mb-12">

School Administration

</h2>

<div className="grid lg:grid-cols-3 md:grid-cols-2 gap-10">

<StaffCard
image="/images/principal.jpg"
name="Mrs Jane Wanjiku"
position="Principal"
description="Experienced education leader committed to academic excellence."
/>

<StaffCard
image="/images/deputy.jpg"
name="Mr Peter Mwangi"
position="Deputy Principal"
description="Coordinates curriculum implementation and student welfare."
/>

<StaffCard
image="/images/bursar.jpg"
name="Mrs Grace Njeri"
position="School Bursar"
description="Responsible for finance and administration."
/>

</div>

</section>

<section className="bg-blue-50 py-20">

<div className="max-w-7xl mx-auto px-6">

<h2 className="text-4xl font-bold mb-12">

School Achievements

</h2>

<Timeline/>

</div>

</section>

</div>

)

}