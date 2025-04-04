"use client";

export default function UserAdmin({ users, handleAction, searchTerm, setSearchTerm }) {
  // Calculate days since last seen and tag as "active" if within 2 years, "inactive" otherwise
  const processedUsers = users.map(user => {
    const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : new Date(user.signupDate);
    const today = new Date();
    const diffTime = Math.abs(today - lastSeenDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const status = diffDays < 730 ? "active" : "inactive"; // Define status directly

    return {
      ...user,
      status,
      daysSinceLastSeen: diffDays,
      lastSeenDate
    };
  });

  const filteredUsers = processedUsers.filter((user) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div style={{ marginLeft: '5px' }} className="space-y-6">
      {/* Stats Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          User Statistics
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-blue-800">Total Users</h3>
            <p className="text-2xl font-bold">{processedUsers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Active</h3>
            <p className="text-2xl font-bold">
              {processedUsers.filter((u) => u.status === "active").length}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Inactive</h3>
            <p className="text-2xl font-bold">
              {processedUsers.filter((u) => u.status === "inactive").length}
            </p>
          </div>
        </div>
      </div>

      {/* User Management Section */}
      <div className="max-w-6xl mx-auto bg-white rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          User Management
        </h1>

        {/* Search Bar */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search by name or email..."
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="py-3 px-4 text-left">Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Sign-Up Date</th>
                <th className="py-3 px-4 text-left">Last Seen</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-3 px-4">{user.name}</td>
                  <td className="py-3 px-4">{user.email}</td>
                  <td className="py-3 px-4">
                    {new Date(user.signupDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    {user.daysSinceLastSeen === 0
                      ? "Today"
                      : `${user.daysSinceLastSeen} day${user.daysSinceLastSeen !== 1 ? 's' : ''} ago`}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        user.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {user.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3 px-4 space-x-2">
                    {user.status === "active" ? (
                      <button
                        onClick={() => handleAction(user.id, "inactive")}
                        className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 text-sm"
                      >
                        Deactivate
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAction(user.id, "active")}
                        className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 text-sm"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}