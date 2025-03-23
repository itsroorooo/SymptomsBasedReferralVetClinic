export default function Dashboard() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white p-5 border-r md:translate-x-0">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Dashboard</h2>
        </div>
        <nav className="mt-5 space-y-2">
          <a href="#" className="block p-2 hover:bg-gray-200 rounded">
            Home
          </a>
          <a href="#" className="block p-2 hover:bg-gray-200 rounded">
            Analytics
          </a>
          <a href="#" className="block p-2 hover:bg-gray-200 rounded">
            Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:ml-64">
        {/* Topbar */}
        <div className="p-5 bg-white border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Welcome to Dashboard</h2>
        </div>

        {/* Content */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 shadow rounded">
            <h3 className="text-lg font-semibold">Users</h3>
            <p className="text-2xl font-bold">1,245</p>
          </div>
          <div className="bg-white p-5 shadow rounded">
            <h3 className="text-lg font-semibold">Revenue</h3>
            <p className="text-2xl font-bold">$12,345</p>
          </div>
          <div className="bg-white p-5 shadow rounded">
            <h3 className="text-lg font-semibold">Orders</h3>
            <p className="text-2xl font-bold">342</p>
          </div>
        </div>
      </div>
    </div>
  );
}
