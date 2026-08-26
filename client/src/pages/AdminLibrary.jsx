import { useCallback, useEffect, useState } from "react";
import PortalShell from "../components/PortalShell";
import { apiRequest } from "../services/api";

const emptyStats = { titles: 0, totalCopies: 0, availableCopies: 0, activeLoans: 0, overdueLoans: 0, pendingReservations: 0 };

export default function AdminLibrary() {
  const [books, setBooks] = useState([]);
  const [stats, setStats] = useState(emptyStats);
  const [loans, setLoans] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const failures = [];

    try {
      const result = await apiRequest("/library/books");
      setBooks(Array.isArray(result?.books) ? result.books : []);
    } catch (e) {
      failures.push(e.message || "catalogue");
    }

    try {
      const result = await apiRequest("/library/admin/overview");
      setStats(result?.stats || emptyStats);
    } catch (e) {
      failures.push(e.message || "overview");
    }

    try {
      const result = await apiRequest("/library/admin/loans");
      setLoans(Array.isArray(result?.loans) ? result.loans : []);
    } catch (e) {
      failures.push(e.message || "loans");
    }

    try {
      const result = await apiRequest("/library/admin/reservations");
      setReservations(Array.isArray(result?.reservations) ? result.reservations : []);
    } catch (e) {
      failures.push(e.message || "reservations");
    }

    if (failures.length) {
      setError("Some library data could not be loaded. The available catalogue remains visible.");
    }
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const derivedStats = {
    titles: books.length,
    totalCopies: books.reduce((sum, book) => sum + Number(book.totalCopies || 0), 0),
    availableCopies: books.reduce((sum, book) => sum + Number(book.availableCopies || 0), 0),
    activeLoans: loans.filter((loan) => ["active", "overdue"].includes(loan.status)).length,
    overdueLoans: loans.filter((loan) => loan.status === "overdue").length,
    pendingReservations: reservations.length,
  };
  const visibleStats = stats.titles || stats.totalCopies || stats.availableCopies || stats.activeLoans || stats.overdueLoans || stats.pendingReservations ? stats : derivedStats;

  return (
    <PortalShell role="admin">
      <div className="space-y-6">
        <header className="rounded-3xl bg-gradient-to-br from-blue-950 via-blue-900 to-slate-900 p-6 text-white shadow-xl md:p-8">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-300">Angels Home SMIS</p>
          <h1 className="mt-2 text-3xl font-black">Library Administration</h1>
          <p className="mt-2 max-w-3xl text-sm text-blue-100">Live catalogue, circulation, reservations and library availability from the school database.</p>
          <button type="button" onClick={() => void load()} disabled={loading} className="mt-5 rounded-xl bg-amber-400 px-4 py-2.5 text-sm font-black text-blue-950 disabled:opacity-60">
            {loading ? "Refreshing…" : "Refresh"}
          </button>
        </header>

        {error && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">{error}</div>}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[["Titles", visibleStats.titles], ["Copies", visibleStats.totalCopies], ["Available", visibleStats.availableCopies], ["Active loans", visibleStats.activeLoans], ["Overdue", visibleStats.overdueLoans], ["Reservations", visibleStats.pendingReservations]].map(([label, value]) => (
            <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</p>
              <p className="mt-2 text-3xl font-black text-blue-950">{Number(value || 0)}</p>
            </article>
          ))}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div><h2 className="text-xl font-black text-blue-950">Catalogue</h2><p className="text-sm text-slate-500">{books.length} active titles currently visible.</p></div>
            <a href="/portal/admin/library" className="rounded-xl border px-4 py-2 text-sm font-bold">Refresh catalogue</a>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Title</th><th className="p-3">Author</th><th className="p-3">Category</th><th className="p-3">Available</th></tr></thead>
              <tbody>
                {books.map((book) => <tr key={book._id} className="border-t"><td className="p-3 font-bold">{book.title}</td><td className="p-3">{book.author}</td><td className="p-3">{book.category || "—"}</td><td className="p-3 font-bold">{book.availableCopies}/{book.totalCopies}</td></tr>)}
                {!books.length && <tr><td colSpan="4" className="p-10 text-center text-slate-500">No active library titles are available.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-blue-950">Current circulation</h2>
            <div className="mt-4 space-y-3">
              {loans.filter((loan) => ["active", "overdue"].includes(loan.status)).slice(0, 20).map((loan) => (
                <div key={loan._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{loan.title}</p><p className="mt-1 text-xs text-slate-500">{loan.borrower?.name || loan.borrower?.email || "Member"} · due {new Date(loan.dueAt).toLocaleDateString()}</p></div>
              ))}
              {!loans.filter((loan) => ["active", "overdue"].includes(loan.status)).length && <p className="text-sm text-slate-500">No active circulation records.</p>}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-xl font-black text-blue-950">Reservation queue</h2>
            <div className="mt-4 space-y-3">
              {reservations.slice(0, 20).map((reservation) => (
                <div key={reservation._id} className="rounded-xl bg-slate-50 p-4"><p className="font-bold">{reservation.title}</p><p className="mt-1 text-xs text-slate-500">{reservation.requester?.name || reservation.requester?.email || "Member"}</p></div>
              ))}
              {!reservations.length && <p className="text-sm text-slate-500">No pending reservations.</p>}
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
