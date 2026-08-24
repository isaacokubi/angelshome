import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function LatestNews() {
  const [news, setNews] = useState([]);

  useEffect(() => {
    let active = true;
    apiRequest("/admin/announcements", { method: "GET" })
      .then((data) => {
        if (active) setNews(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (active) setNews([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-blue-900">
          Latest School Announcements
        </h2>

        {news.length === 0 ? (
          <p className="text-center mt-8 text-gray-500">No announcements available.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-10">
            {news.map((item) => {
              const dateValue = item.date || item.createdAt;
              const date = dateValue ? new Date(dateValue) : null;
              return (
                <article key={item._id || `${item.title}-${dateValue}`} className="bg-white shadow-md rounded-xl p-5 sm:p-6 hover:shadow-xl transition flex flex-col">
                  <h3 className="text-lg sm:text-xl font-bold text-blue-900 break-words">{item.title}</h3>
                  <p className="mt-3 sm:mt-4 text-gray-700 leading-7 text-sm sm:text-base flex-grow">{item.content}</p>
                  {date && !Number.isNaN(date.getTime()) && (
                    <p className="text-xs sm:text-sm text-gray-500 mt-4">{date.toLocaleDateString()}</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
