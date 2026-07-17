export default function SocialLinks() {
  return (
    <div className="flex gap-5 mt-6">
      <a
        href="https://facebook.com/josephat.okama"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-700 text-white px-5 py-3 rounded-lg"
      >
        Facebook
      </a>

      <a
        href="https://x.com/josephatAndula"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-black text-white px-5 py-3 rounded-lg"
      >
        X
      </a>

      <a
        href="https://www.youtube.com/@josephatAndula4781"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-red-600 text-white px-5 py-3 rounded-lg"
      >
        YouTube
      </a>
    </div>
  );
}