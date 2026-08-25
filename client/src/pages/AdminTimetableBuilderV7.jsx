import { useEffect, useState } from "react";
import AdminTimetableBuilderV6 from "./AdminTimetableBuilderV6";
import TimetableResourceManager from "../components/TimetableResourceManager";

function ResourceProcessingState() {
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const check = () => {
      const classInput = [...document.querySelectorAll('input')].find((input) => input.placeholder === "Class name e.g. Grade 4");
      const subjectInput = [...document.querySelectorAll('input')].find((input) => input.placeholder === "Subject name");
      const buttons = [...document.querySelectorAll("button")];
      const classButton = buttons.find((button) => /Create class|Creating class/.test(button.textContent || ""));
      const subjectButton = buttons.find((button) => /Create subject|Creating subject/.test(button.textContent || ""));
      setProcessing(Boolean((classInput?.value && classButton?.disabled) || (subjectInput?.value && subjectButton?.disabled)));
    };
    const observer = new MutationObserver(check);
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true });
    check();
    return () => observer.disconnect();
  }, []);

  return processing ? <div className="sticky top-2 z-50 mx-auto max-w-3xl rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm font-bold text-blue-900 shadow-sm">Processing your request… please wait while the class or subject is being created.</div> : null;
}

export default function AdminTimetableBuilderV7() {
  return <>
    <ResourceProcessingState />
    <div className="p-6 pb-0"><TimetableResourceManager /></div>
    <AdminTimetableBuilderV6 />
  </>;
}
