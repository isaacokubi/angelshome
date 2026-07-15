import { useEffect, useState } from "react";

export default function ProgressBar() {
  const goal = 500000;
  const raised = 54500;

  const percentage = Math.floor((raised / goal) * 100);

  const [width, setWidth] = useState(0);

  useEffect(() => {
    setTimeout(() => {
      setWidth(percentage);
    }, 500);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">

      <h2 className="text-3xl font-bold text-blue-900">
        School Development Fund
      </h2>

      <p className="mt-4">
        Goal: KES {goal.toLocaleString()}
      </p>

      <p>
        Raised: KES {raised.toLocaleString()}
      </p>

      <div className="mt-6 h-6 bg-gray-200 rounded-full overflow-hidden">

        <div
          style={{ width: `${width}%` }}
          className="bg-green-600 h-full transition-all duration-[2500ms]"
        ></div>

      </div>

      <h3 className="mt-4 font-bold text-xl">
        {percentage}% Completed
      </h3>

    </div>
  );
}