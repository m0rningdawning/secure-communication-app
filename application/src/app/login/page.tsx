"use client";

import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function LoginPage() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/chat");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrorMessage(data.message || "An error occurred. Please try again.");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userId", data.userId);
      localStorage.setItem("email", email);
      router.push("/chat");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[url('/imgs/login_bg_169.svg')] md:bg-[url('/imgs/login_bg_169.svg')] sm:bg-[url('/imgs/login_bg_916.svg')] bg-cover bg-center">
      <div className="bg-[#001f53] p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-4xl font-bold text-center mb-4 underline decoration-purple-600">
          <span className="text-purple-600">Secure</span> Chat
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#ededed]"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-[#2b2d31] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="youremail@example.com"
              required
            />
          </div>

          <div className="mb-4 relative">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#ededed]"
            >
              Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-[#2b2d31] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="••••••••"
              required
            />
            <div
              className="absolute inset-y-0 right-0 pt-6 pr-3 flex items-center cursor-pointer"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <FaEyeSlash className="text-gray-500" />
              ) : (
                <FaEye className="text-gray-500" />
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 text-sm text-red-500">{errorMessage}</div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
          >
            Login
          </button>
        </form>

        <p className="text-sm text-center text-[#ededed] mt-7">
          Don&apos;t have an account?{" "}
          <a
            href="/register"
            className="text-purple-500 hover:text-purple-700 transition duration-200 transform"
          >
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
