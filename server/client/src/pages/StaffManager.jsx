import { useEffect, useState } from "react";
import { cmsApi } from "../services/cmsApi";

const emptyStaff = {
  name: "",
  position: "",
  department: "",
  qualification: "",
  email: "",
  phone: "",
  bio: ""
};

export default function StaffManager() {

  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyStaff);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    loadStaff();
  }, []);

  async function loadStaff() {
    try {
      const data = await cmsApi.get("/staff");
      setStaff(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  }

  async function saveStaff(e) {
    e.preventDefault();

    try {

      if (editingId) {

        await cmsApi.update(
          `/staff/${editingId}`,
          form
        );

      } else {

        await cmsApi.create(
          "/staff",
          form
        );

      }

      setForm(emptyStaff);
      setEditingId(null);

      loadStaff();

    } catch (err) {
      console.error(err);
      alert("Unable to save staff.");
    }
  }

  function editStaff(member) {
    setEditingId(member._id);

    setForm({
      name: member.name,
      position: member.position,
      department: member.department,
      qualification: member.qualification,
      email: member.email,
      phone: member.phone,
      bio: member.bio
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  }

  async function deleteStaff(id) {

    if (!window.confirm("Delete this staff member?"))
      return;

    try {

      await cmsApi.delete(`/staff/${id}`);

      loadStaff();

    } catch (err) {

      alert("Delete failed");

    }

  }

  const filtered = staff.filter(member =>
    member.name.toLowerCase().includes(search.toLowerCase()) ||
    member.department.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div>Loading...</div>;
  }

  return (

<div>

<h1 className="text-4xl font-bold text-blue-900">

Staff Manager

</h1>

<form
onSubmit={saveStaff}
className="bg-white rounded-xl shadow p-8 mt-8">

<div className="grid md:grid-cols-2 gap-6">

<input
name="name"
placeholder="Full Name"
value={form.name}
onChange={handleChange}
className="border p-3 rounded"
required
/>

<input
name="position"
placeholder="Position"
value={form.position}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
name="department"
placeholder="Department"
value={form.department}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
name="qualification"
placeholder="Qualification"
value={form.qualification}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
name="email"
placeholder="Email"
value={form.email}
onChange={handleChange}
className="border p-3 rounded"
/>

<input
name="phone"
placeholder="Phone"
value={form.phone}
onChange={handleChange}
className="border p-3 rounded"
/>

</div>

<textarea
name="bio"
placeholder="Biography"
value={form.bio}
onChange={handleChange}
rows={5}
className="border p-3 rounded mt-6 w-full"
/>

<button
className="bg-blue-900 text-white px-8 py-3 rounded mt-6">

{editingId ? "Update Staff" : "Add Staff"}

</button>

</form>

<input
placeholder="Search staff..."
value={search}
onChange={(e)=>setSearch(e.target.value)}
className="border rounded p-3 w-full mt-10"
/>

<div className="grid lg:grid-cols-2 gap-6 mt-8">

{filtered.map(member=>(

<div
key={member._id}
className="bg-white shadow rounded-xl p-6">

<div className="flex justify-between">

<div>

<h2 className="text-2xl font-bold">

{member.name}

</h2>

<p>{member.position}</p>

<p className="text-sm text-gray-600">

{member.department}

</p>

</div>

<div className="space-x-2">

<button
onClick={()=>editStaff(member)}
className="bg-yellow-500 text-white px-4 py-2 rounded">

Edit

</button>

<button
onClick={()=>deleteStaff(member._id)}
className="bg-red-600 text-white px-4 py-2 rounded">

Delete

</button>

</div>

</div>

<p className="mt-4">

{member.bio}

</p>

</div>

))}

</div>

</div>

);

}