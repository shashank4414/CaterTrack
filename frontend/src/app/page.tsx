export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold mb-6">Catering Management System</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <a
          href="/clients"
          className="p-6 bg-white shadow rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Clients</h2>
          <p className="text-gray-600">Manage client records</p>
        </a>

        <a
          href="/menu-items"
          className="p-6 bg-white shadow rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Menu Items</h2>
          <p className="text-gray-600">View and edit menu items</p>
        </a>

        <a
          href="/categories"
          className="p-6 bg-white shadow rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Categories</h2>
          <p className="text-gray-600">Organize menu categories</p>
        </a>

        <a
          href="/orders"
          className="p-6 bg-white shadow rounded hover:bg-gray-50"
        >
          <h2 className="text-xl font-semibold">Orders</h2>
          <p className="text-gray-600">Manage customer orders</p>
        </a>
      </div>
    </main>
  );
}
