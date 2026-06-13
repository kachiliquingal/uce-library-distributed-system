import { useState, useEffect } from "react";
import { userApi } from "../../../api/client";
import { useAuthStore } from "../../../store/authStore";

export const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthStore();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await userApi.get("/users");
      setUsers(response.data);
    } catch (err) {
      setError("Error fetching users");
    } finally {
      setIsLoading(false);
    }
  };

  const assignRole = async (userId, role) => {
    try {
      await userApi.put(`/users/${userId}/roles`, { role });
      fetchUsers(); // Refresh list
    } catch (err) {
      setError("Error assigning role");
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all users in the system including their roles.
          </p>
        </div>
      </div>
      <div className="mt-8 flex flex-col">
        <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg bg-white">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">Email</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Roles</th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900">
                        {u.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        {u.roles?.map(r => r.name).join(", ") || "No roles"}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 space-x-2">
                        <button 
                          onClick={() => assignRole(u.id, "user")}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Make User
                        </button>
                        <button 
                          onClick={() => assignRole(u.id, "admin")}
                          className="text-red-600 hover:text-red-900"
                        >
                          Make Admin
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
