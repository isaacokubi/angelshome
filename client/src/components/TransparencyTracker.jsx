const donations=[

{
name:"Anonymous",
amount:"KES 10,000",
project:"Library Development"
},


{
name:"John Family",
amount:"KES 5,000",
project:"Scholarship Fund"
},


{
name:"Community Support Group",
amount:"KES 25,000",
project:"Sports Equipment"
}

];



export default function TransparencyTracker(){


return(

<div>


<h2 className="text-3xl font-bold text-blue-900 mb-8">

Recent Contributions

</h2>



<div className="space-y-5">


{
donations.map((donation,index)=>(


<div

key={index}

className="bg-white shadow rounded-lg p-6 flex justify-between"

>


<div>

<h3 className="font-bold">

{donation.name}

</h3>


<p>

{donation.project}

</p>


</div>



<div className="text-green-700 font-bold">

{donation.amount}

</div>


</div>


))
}



</div>


</div>

)

}