"use client";

export default function UserAdmin({ 
  users = [], 
  allUsers = [], 
  handleAction, 
  searchTerm, 
  setSearchTerm,
  isUserActive 
}) {
  // Process users with consistent active status calculation
  const processedUsers = users.map(user => {
    const lastSeenDate = user.lastSeen ? new Date(user.lastSeen) : new Date(user.signupDate || new Date());
    const today = new Date();
    const diffTime = Math.abs(today - lastSeenDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Use the passed isUserActive function if available, otherwise calculate locally
    const status = isUserActive ? (isUserActive(user) ? "active" : "inactive") 
                               : (diffDays < 730 ? "active" : "inactive");

    return {
      ...user,
      status,
      daysSinceLastSeen: diffDays,
      lastSeenDate
    };
  });

  // Filter users based on search term
  const filteredUsers = processedUsers.filter((user) =>
    (user.name?.toLowerCase().includes(searchTerm.toLowerCase()) || "") ||
    (user.email?.toLowerCase().includes(searchTerm.toLowerCase()) || "")
  );

  // Calculate active users count using the same logic as dashboard
  const activeUsersCount = isUserActive 
    ? allUsers.filter(isUserActive).length 
    : processedUsers.filter(u => u.status === "active").length;

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
            <p className="text-2xl font-bold">{allUsers.length}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-green-800">Active</h3>
            <p className="text-2xl font-bold">
              {activeUsersCount}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium text-red-800">Inactive</h3>
            <p className="text-2xl font-bold">
              {allUsers.length - activeUsersCount}
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">{user.name || 'N/A'}</td>
                    <td className="py-3 px-4">{user.email || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {user.signupDate ? new Date(user.signupDate).toLocaleDateString() : 'N/A'}
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
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-4 text-center text-gray-500">
                    No users found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}