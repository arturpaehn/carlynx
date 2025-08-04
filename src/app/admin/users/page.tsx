"use client";


import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface UserProfile {
  user_id: string;
  name?: string;
  phone?: string;
  email: string;
  is_blocked: boolean;
  dealer_attempts_count?: number;
}

export default function UsersPage() {
  // --- ВСЕ ХУКИ ВЫЗЫВАЮТСЯ СРАЗУ ---
  const [accessLoading, setAccessLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [searchEmailInput, setSearchEmailInput] = useState("");
  const [searchAttemptsInput, setSearchAttemptsInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchAttempts, setSearchAttempts] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'dealer_attempts_count' | 'actions' | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const USERS_PER_PAGE = 25;

  useEffect(() => {
    async function checkAdmin() {
      setAccessLoading(true);
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email;
      setIsAdmin(email === "admin@carlynx.us");
      setAccessLoading(false);
    }
    checkAdmin();
  }, []);

  useEffect(() => {
    fetchUsers();
  }, []);

  if (accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-gray-600 font-bold border-2 border-gray-200 bg-white rounded shadow-lg">
          Checking access...
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg text-red-600 font-bold border-2 border-red-300 bg-white rounded shadow-lg">
          Access denied. This page is for administrators only.
        </div>
      </div>
    );
  }
  // хуки объявлены выше, дубли не нужны
  // USERS_PER_PAGE и useEffect уже объявлены выше, дубли не нужны

  async function fetchUsers() {
    setLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, name, phone, email, is_blocked, dealer_attempts_count');
    if (error) setError(error.message);
    else setUsers(data || []);
    setLoading(false);
  }

  function handleSort(column: 'dealer_attempts_count' | 'actions') {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  }

  function getFilteredAndSortedUsers() {
    let filtered = users;
    if (searchEmail.trim() !== "") {
      filtered = filtered.filter(u => u.email.toLowerCase().includes(searchEmail.trim().toLowerCase()));
    }
    if (searchAttempts.trim() !== "") {
      const attempts = parseInt(searchAttempts, 10);
      if (!isNaN(attempts)) {
        filtered = filtered.filter(u => (u.dealer_attempts_count ?? 0) === attempts);
      }
    }
    const sorted = [...filtered];
    if (sortBy === 'dealer_attempts_count') {
      sorted.sort((a, b) => {
        const aVal = a.dealer_attempts_count ?? 0;
        const bVal = b.dealer_attempts_count ?? 0;
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      });
    } else if (sortBy === 'actions') {
      sorted.sort((a, b) => {
        if (sortOrder === 'asc') {
          return Number(a.is_blocked) - Number(b.is_blocked);
        } else {
          return Number(b.is_blocked) - Number(a.is_blocked);
        }
      });
    }
    return sorted;
  }

  // Pagination logic with search
  const filteredSortedUsers = getFilteredAndSortedUsers();
  const totalPages = Math.max(1, Math.ceil(filteredSortedUsers.length / USERS_PER_PAGE));
  const pagedUsers = filteredSortedUsers.slice((page - 1) * USERS_PER_PAGE, page * USERS_PER_PAGE);

  async function toggleBlock(user: UserProfile) {
    const { error } = await supabase
      .from('user_profiles')
      .update({ is_blocked: !user.is_blocked })
      .eq('user_id', user.user_id);
    if (!error) {
      setUsers((prev) => prev.map(u => u.user_id === user.user_id ? { ...u, is_blocked: !u.is_blocked } : u));
    } else {
      alert('Error: ' + error.message);
    }
  }

  return (
    <div className="px-2 sm:px-8 mt-16 sm:mt-24">
      <div className="mb-4">
        <a
          href="/admin/"
          className="inline-block px-3 py-2 sm:px-4 sm:py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-150 text-xs sm:text-base"
        >
          ← Back to admin panel
        </a>
      </div>
      <h2 className="text-xl sm:text-2xl font-bold mb-4">User Management</h2>
      {/* Search fields */}
      <div className="flex flex-wrap gap-2 sm:gap-4 mb-6 items-center">
        <input
          type="text"
          placeholder="Search by Email"
          value={searchEmailInput}
          onChange={e => setSearchEmailInput(e.target.value)}
          className="border rounded px-2 py-1 sm:px-3 sm:py-2 w-36 sm:w-64 text-xs sm:text-base"
        />
        <input
          type="number"
          placeholder="Search by Dealer Attempts"
          value={searchAttemptsInput}
          onChange={e => setSearchAttemptsInput(e.target.value)}
          className="border rounded px-2 py-1 sm:px-3 sm:py-2 w-36 sm:w-64 text-xs sm:text-base"
        />
        <button
          className="px-3 py-1 sm:px-4 sm:py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors duration-150 text-xs sm:text-base"
          onClick={() => { setSearchEmail(searchEmailInput); setSearchAttempts(searchAttemptsInput); setPage(1); }}
        >
          Apply
        </button>
      </div>
      {error && <div className="mb-4 text-red-600 text-xs sm:text-base">Error: {error}</div>}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-xs sm:text-sm">
          <thead>
            <tr className="bg-orange-100">
              <th className="p-2 sm:p-2 border whitespace-nowrap">Email</th>
              <th className="p-2 sm:p-2 border whitespace-nowrap">ID</th>
              <th
                className={`p-2 sm:p-2 border cursor-pointer select-none transition-colors duration-150 whitespace-nowrap ${sortBy === 'dealer_attempts_count' ? 'bg-orange-300 text-orange-900 font-bold shadow-inner' : 'hover:bg-orange-200'}`}
                onClick={() => handleSort('dealer_attempts_count')}
                title="Sort by dealer attempts"
              >
                <span className="hidden sm:inline">Dealer Attempts</span>
                <span className="inline sm:hidden">Attempts</span> {sortBy === 'dealer_attempts_count' ? (sortOrder === 'asc' ? '▲' : '▼') : <span className="text-gray-400">⇅</span>}
              </th>
              <th
                className={`p-2 sm:p-2 border cursor-pointer select-none transition-colors duration-150 whitespace-nowrap ${sortBy === 'actions' ? 'bg-orange-300 text-orange-900 font-bold shadow-inner' : 'hover:bg-orange-200'}`}
                onClick={() => handleSort('actions')}
                title="Sort by blocked status"
              >
                <span className="hidden sm:inline">Blocked</span>
                <span className="inline sm:hidden">Block</span> {sortBy === 'actions' ? (sortOrder === 'asc' ? '▲' : '▼') : <span className="text-gray-400">⇅</span>}
              </th>
              <th className="p-2 sm:p-2 border whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-4">Loading...</td></tr>
            ) : filteredSortedUsers.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-4">No users found</td></tr>
            ) : (
              pagedUsers.map((user: UserProfile) => (
                <tr key={user.user_id}>
                  <td className="border p-2 break-all max-w-[120px] sm:max-w-none">{user.email}</td>
                  <td className="border p-2 break-all max-w-[120px] sm:max-w-none">{user.user_id}</td>
                  <td className="border p-2 text-center">{user.dealer_attempts_count ?? 0}</td>
                  <td className="border p-2 text-center">{user.is_blocked ? 'Yes' : 'No'}</td>
                  {user.email === 'admin@carlynx.us' ? (
                    <td className="border p-2 text-center"></td>
                  ) : (
                    <td className="border p-2 text-center">
                      <button
                        className={`px-2 py-1 sm:px-3 sm:py-1 rounded ${user.is_blocked ? 'bg-green-500' : 'bg-red-500'} text-white text-xs sm:text-base`}
                        onClick={() => toggleBlock(user)}
                      >
                        {user.is_blocked ? 'Unblock' : 'Block'}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-base"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </button>
          <span className="mx-2 text-xs sm:text-base">Page {page} of {totalPages}</span>
          <button
            className="px-2 py-1 sm:px-3 sm:py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 text-xs sm:text-base"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
