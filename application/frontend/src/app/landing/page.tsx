"use client";

import { useRouter } from "next/navigation";
import { HiArrowRight } from "react-icons/hi";

export default function LandingPage() {
  const router = useRouter();

  const navigateToLogin = () => router.push("/login");
  const navigateToRegister = () => router.push("/register");

  return (
    <div className="relative flex flex-col items-center justify-center h-screen bg-cover bg-center bg-[url('/imgs/login_bg_169.svg')] md:bg-[url('/imgs/login_bg_169.svg')] sm:bg-[url('/imgs/login_bg_916.svg')]">
      
      <header className="absolute top-0 left-0 w-full p-4 flex justify-between items-center bg-opacity-90 backdrop-blur-lg shadow-md">
        <h1 className="text-2xl font-bold text-white cursor-pointer" onClick={() => router.push("/")}>
          <span className="text-purple-600">Secure</span> Chat
        </h1>
        <div className="space-x-4">
          <button onClick={navigateToLogin} className="text-white hover:underline">Login</button>
          <button onClick={navigateToRegister} className="text-white hover:underline">Register</button>
        </div>
      </header>

      <main className="bg-[#001f53] bg-opacity-90 p-10 rounded-lg shadow-lg max-w-2xl text-center text-white space-y-6">
        <h2 className="text-5xl font-extrabold underline decoration-purple-600">
          Welcome to Secure Chat
        </h2>
        <p className="text-xl text-gray-200 max-w-md mx-auto">
          Connect securely with your friends and colleagues with end-to-end encrypted messages.
        </p>
        <div className="flex justify-center space-x-6 mt-4">
          <button
            onClick={navigateToLogin}
            className="flex items-center justify-center bg-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300 transform hover:-translate-y-1"
          >
            <span className="mr-2">Login</span>
            <HiArrowRight className="w-5 h-5" />
          </button>
          <button
            onClick={navigateToRegister}
            className="flex items-center justify-center bg-purple-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-purple-700 transition duration-300 transform hover:-translate-y-1"
          >
            <span className="mr-2">Register</span>
            <HiArrowRight className="w-5 h-5" />
          </button>
        </div>
      </main>

      <footer className="absolute bottom-0 text-gray-400 text-center py-4">
        <p>&copy; {new Date().getFullYear()} Secure Chat. All rights reserved.</p>
      </footer>
    </div>
  );
}
