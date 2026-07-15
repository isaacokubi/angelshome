export default function AdminCMS() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-blue-900">
        Content Management System
      </h1>

      <p className="mt-4 text-gray-600">
        Use the navigation menu to manage school content.
      </p>

      <div className="grid md:grid-cols-3 gap-6 mt-10">

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            Staff
          </h3>

          <p className="mt-2">
            Manage teachers and administration profiles.
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            Hero Slides
          </h3>

          <p className="mt-2">
            Control homepage banners.
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            Gallery
          </h3>

          <p className="mt-2">
            Upload school activity photos.
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            Events
          </h3>

          <p className="mt-2">
            Manage academic calendar and events.
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            Fees
          </h3>

          <p className="mt-2">
            Update fee structure.
          </p>
        </div>

        <div className="bg-white shadow rounded-xl p-6">
          <h3 className="font-bold text-xl">
            School Settings
          </h3>

          <p className="mt-2">
            Update school contact information and branding.
          </p>
        </div>

      </div>
    </div>
  );
}