"use client";

export default function SidebarNav({
  isSidebarOpen,
  toggleSidebar,
  setActiveComponent,
  activeComponent,
  navItems
}) {
  return (
    <>
      {/* Mobile sidebar overlay */}
      <div
        className={`fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden ${
          isSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleSidebar}
      />

      {/* Mobile sidebar */}
      <div
        className={`fixed inset-y-0 left-0 flex flex-col z-40 w-64 max-w-xs transform transition duration-300 ease-in-out bg-gray-900 lg:hidden ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo and Name */}
        <div className="p-4 flex flex-col items-center">
          <h1 className="text-2xl font-bold text-white">Vet Clinic</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto pt-5 pb-4">
          <nav className="mt-5 px-2 space-y-1">
            {navItems.map((item) => (
              <button
                key={item.name}
                onClick={() => {
                  setActiveComponent(item.component);
                  toggleSidebar();
                }}
                className={`group flex items-center px-4 py-3 text-lg font-medium rounded-md w-full text-left ${
                  activeComponent === item.component
                    ? 'bg-blue-500 text-white'
                    : 'text-gray-300 hover:bg-blue-500 hover:text-white'
                }`}
              >
                <item.icon
                  className={`mr-4 h-6 w-6 ${
                    activeComponent === item.component
                      ? 'text-white'
                      : 'text-blue-400 group-hover:text-white'
                  }`}
                />
                <span>{item.name}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gray-900">
          {/* Logo and Name */}
          <div className="p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold text-white">Vet Clinic</h1>
          </div>

          {/* Navigation Links */}
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.name}
                  onClick={() => setActiveComponent(item.component)}
                  className={`group flex items-center px-4 py-3 text-lg rounded-md w-full text-left ${
                    activeComponent === item.component
                      ? 'bg-blue-500 text-white'
                      : 'text-white hover:bg-blue-500 hover:text-white'
                  }`}
                >
                  <item.icon
                    className={`mr-4 h-6 w-6 ${
                      activeComponent === item.component
                        ? 'text-white'
                        : 'text-blue-400 group-hover:text-white'
                    }`}
                  />
                  <span>{item.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}