"use client";

import { useEffect, useState } from "react";

interface User {
  user_id: string;
  email: string;
  listings_count: number;
  dealer_attempts_count: number;
  is_blocked: boolean;
}
import { supabase } from "@/lib/supabaseClient";

export default function AdminPage() {
  const [tab, setTab] = useState<'users' | 'listings'>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]); // для хранения всех пользователей
  const [filter, setFilter] = useState({ email: "", dealerAttempts: "" });
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<unknown>(null); // для отладки
  const [sort, setSort] = useState<{ field: string; direction: 'asc' | 'desc' }>({ field: '', direction: 'asc' });

  useEffect(() => {
    const checkAdmin = async () => {
      const { data } = await supabase.auth.getUser();
      const email = data?.user?.email || "";
      // Укажите здесь email(ы) админов
      const adminEmails = ["admin@carlynx.us"];
      if (adminEmails.includes(email)) {
        setIsAdmin(true);
        fetchUsers();
      } else {
        setIsAdmin(false);
      }
    };
    checkAdmin();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    setFetchError(null);
    setRawData(null);
    const { data, error } = await supabase.rpc("admin_get_users");
    setRawData(data);
    if (error) {
      setFetchError(error.message || JSON.stringify(error));
      setAllUsers([]);
      setUsers([]);
    } else if (data) {
      setAllUsers(data);
      setUsers(data);
    } else {
      setFetchError("No data returned from admin_get_users");
      setAllUsers([]);
      setUsers([]);
    }
    setLoading(false);
  }

  function applyFilters() {
    let filtered = allUsers;
    if (filter.email.trim()) {
      filtered = filtered.filter(u => u.email.toLowerCase().includes(filter.email.trim().toLowerCase()));
    }
    if (filter.dealerAttempts.trim()) {
      const attempts = parseInt(filter.dealerAttempts, 10);
      if (!isNaN(attempts)) {
        filtered = filtered.filter(u => u.dealer_attempts_count === attempts);
      }
    }
    setUsers(applySort(filtered));
  }

  function applySort(list: User[]): User[] {
    if (!sort.field) return list;
    const sorted = [...list].sort((a, b) => {
      let aValue: number, bValue: number;
      switch (sort.field) {
        case 'status':
          aValue = a.is_blocked ? 1 : 0;
          bValue = b.is_blocked ? 1 : 0;
          break;
        case 'listings':
          aValue = a.listings_count;
          bValue = b.listings_count;
          break;
        case 'dealer_attempts':
          aValue = a.dealer_attempts_count;
          bValue = b.dealer_attempts_count;
          break;
        default:
          return 0;
      }
      if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  }

  function handleSort(field: string) {
    setSort(prev => {
      if (prev.field === field) {
        // Меняем направление
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { field, direction: 'asc' };
    });
  }

  useEffect(() => {
    setUsers(applySort(users));
    // eslint-disable-next-line
  }, [sort]);

  const adminEmails = ["admin@carlynx.us"];
  async function toggleBlock(user_id: string, is_blocked: boolean, email?: string) {
    if (email && adminEmails.includes(email)) return; // нельзя блокировать админа
    await supabase.from("user_profiles").update({ is_blocked: !is_blocked }).eq("user_id", user_id);
    fetchUsers();
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-center text-lg">Checking admin access...</div>
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
  return (
    <div className="p-6 max-w-6xl mx-auto pt-24">
      <h1 className="text-2xl font-bold mb-6">Admin Panel</h1>
      {/* Tabs */}
      <div className="mb-6 flex gap-4 border-b">
        <button
          className={`px-4 py-2 -mb-px border-b-2 ${tab === 'users' ? 'border-blue-500 font-bold text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('users')}
        >
          User Management
        </button>
        <button
          className={`px-4 py-2 -mb-px border-b-2 ${tab === 'listings' ? 'border-blue-500 font-bold text-blue-700' : 'border-transparent text-gray-500'}`}
          onClick={() => setTab('listings')}
        >
          Listings Management
        </button>
      </div>

      {tab === 'users' && (
        <>
          {fetchError && (
            <div className="mb-4 p-4 bg-red-100 text-red-700 border border-red-300 rounded">
              <div className="font-bold">Error loading users:</div>
              <div>{fetchError}</div>
            </div>
          )}
          {Array.isArray(rawData) && rawData.length === 0 && (
            <div className="mb-4 p-4 bg-yellow-100 text-yellow-700 border border-yellow-300 rounded">
              <div className="font-bold">Debug:</div>
              <div>admin_get_users вернул пустой массив. Проверьте права доступа и содержимое таблиц.</div>
            </div>
          )}
          {/* Фильтры */}
          <div className="mb-4 flex flex-wrap gap-4">
            <input
              type="text"
              placeholder="Email"
              value={filter.email}
              onChange={e => setFilter(f => ({ ...f, email: e.target.value }))}
              className="border p-2 rounded"
            />
            <input
              type="number"
              placeholder="Dealer Attempts"
              value={filter.dealerAttempts}
              onChange={e => setFilter(f => ({ ...f, dealerAttempts: e.target.value }))}
              className="border p-2 rounded"
            />
            <button
              className="px-4 py-2 bg-blue-500 text-white rounded"
              onClick={applyFilters}
            >
              Apply Filters
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm">
              <thead>
                <tr className="bg-orange-100">
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border cursor-pointer select-none" onClick={() => handleSort('listings')}>
                    Listings
                    <span className="ml-1 align-middle">
                      {sort.field === 'listings'
                        ? (sort.direction === 'asc' ? <b>▲</b> : <b>▼</b>)
                        : <span style={{ color: '#bbb' }}>▲▼</span>}
                    </span>
                  </th>
                  <th className="p-2 border cursor-pointer select-none" onClick={() => handleSort('dealer_attempts')}>
                    Dealer Attempts
                    <span className="ml-1 align-middle">
                      {sort.field === 'dealer_attempts'
                        ? (sort.direction === 'asc' ? <b>▲</b> : <b>▼</b>)
                        : <span style={{ color: '#bbb' }}>▲▼</span>}
                    </span>
                  </th>
                  <th className="p-2 border cursor-pointer select-none" onClick={() => handleSort('status')}>
                    Status
                    <span className="ml-1 align-middle">
                      {sort.field === 'status'
                        ? (sort.direction === 'asc' ? <b>▲</b> : <b>▼</b>)
                        : <span style={{ color: '#bbb' }}>▲▼</span>}
                    </span>
                  </th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} className="text-center p-4">Loading...</td></tr>
                ) : users.length === 0 ? (
                  <tr><td colSpan={7} className="text-center p-4">No users found</td></tr>
                ) : (
                  users.map(u => (
                    <tr key={u.user_id} className={u.is_blocked ? "bg-red-50" : ""}>
                      <td className="border p-2">{u.email}</td>
                      <td className="border p-2 text-center">{u.listings_count}</td>
                      <td className="border p-2 text-center">{u.dealer_attempts_count}</td>
                      <td className="border p-2 text-center font-bold">{u.is_blocked ? "Blocked" : "Active"}</td>
                      <td className="border p-2 text-center">
                        {adminEmails.includes(u.email) ? (
                          <span className="text-gray-400 italic">Admin</span>
                        ) : (
                          <button
                            className={`px-3 py-1 rounded ${u.is_blocked ? "bg-green-500" : "bg-red-500"} text-white`}
                            onClick={() => toggleBlock(u.user_id, u.is_blocked, u.email)}
                          >
                            {u.is_blocked ? "Unblock" : "Block"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'listings' && (
        <div className="p-8 text-center text-gray-500">
          <div className="text-lg font-semibold mb-2">Listings Management</div>
          <div>Здесь будет управление объявлениями (в разработке).</div>
        </div>
      )}
    </div>
  );
}
