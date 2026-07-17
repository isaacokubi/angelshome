import { useState } from "react";

export default function ContactForm() {

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });


  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);



  function handleChange(e) {

    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

  }



  async function submitForm(e) {

    e.preventDefault();


    if (!form.name || !form.email || !form.message) {

      setStatus("Please fill in all required fields.");

      return;
    }



    try {

      setLoading(true);
      setStatus("");



      const response = await fetch(
        "https://angelshome-1.onrender.com/api/contact",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(form),
        }
      );



      const data = await response.json();



      if (!response.ok) {

        throw new Error(
          data.message || "Failed to send message"
        );

      }



      setStatus(
        "Message sent successfully. We will get back to you soon."
      );



      setForm({
        name: "",
        email: "",
        phone: "",
        message: "",
      });



    } catch (error) {


      console.log(error);


      setStatus(
        "Unable to send message. Please try again."
      );



    } finally {

      setLoading(false);

    }

  }



  return (

    <form
      onSubmit={submitForm}
      className="bg-white rounded-xl shadow-xl p-8"
    >


      <h2 className="text-3xl font-bold text-blue-900">
        Send Us A Message
      </h2>



      <label className="block mt-6 font-semibold">
        Full Name *
      </label>


      <input

        type="text"

        name="name"

        value={form.name}

        onChange={handleChange}

        className="w-full border p-3 rounded mt-2"

        placeholder="Your name"

        required

      />




      <label className="block mt-6 font-semibold">
        Email Address *
      </label>



      <input

        type="email"

        name="email"

        value={form.email}

        onChange={handleChange}

        className="w-full border p-3 rounded mt-2"

        placeholder="example@email.com"

        required

      />





      <label className="block mt-6 font-semibold">
        Phone Number
      </label>



      <input

        type="text"

        name="phone"

        value={form.phone}

        onChange={handleChange}

        className="w-full border p-3 rounded mt-2"

        placeholder="07XXXXXXXX"

      />






      <label className="block mt-6 font-semibold">
        Message *
      </label>




      <textarea

        name="message"

        value={form.message}

        onChange={handleChange}

        rows="5"

        className="w-full border p-3 rounded mt-2"

        placeholder="Write your message..."

        required

      />






      <button

        type="submit"

        disabled={loading}

        className={`mt-8 px-8 py-4 rounded-lg text-white ${
          loading
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-900 hover:bg-blue-800"
        }`}

      >

        {loading ? "Sending..." : "Send Message"}

      </button>






      {status && (

        <p

          className={`mt-5 font-semibold ${
            status.includes("successfully")
              ? "text-green-700"
              : "text-red-600"
          }`}

        >

          {status}

        </p>

      )}



    </form>

  );

}