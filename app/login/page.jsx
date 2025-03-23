import { login, signup } from "./actions";

export default function LoginPage() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white shadow-lg rounded-lg p-8 w-96">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Welcome Back
        </h2>
        <form className="flex flex-col gap-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700"
            >
              Email:
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-1 block w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Password:
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full p-2 border rounded-md focus:ring focus:ring-blue-300"
            />
          </div>

          <button
            formAction={login}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-md transition"
          >
            Log in
          </button>
          <button
            formAction={signup}
            className="w-full bg-gray-300 hover:bg-gray-400 text-black py-2 rounded-md transition"
          >
            Sign up
          </button>
        </form>
      </div>
    </div>
  );
}
