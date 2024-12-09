"use client";

import { generateKeyPair } from "@/lib/cryptoUtils";
import { useRouter } from "next/navigation";
import { useState, FormEvent, useEffect } from "react";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function RegisterPage() {
  const [email, setEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/chat");
    }
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !userName || !password || !confirmPassword) {
      setErrorMessage("Please fill out all fields.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      const { publicKey, privateKey } = await generateKeyPair();

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          username: userName,
          password,
          publicKey,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("privateKey", privateKey);
        downloadPrivateKey(privateKey);
        setSuccessMessage("Registration successful! Redirecting to login...");
        setErrorMessage(null);

        setTimeout(() => {
          router.push("/login");
        }, 1000);
      } else {
        setErrorMessage(
          data.message || "Failed to register. Please try again."
        );
      }
    } catch (error) {
      console.log(error);
      setErrorMessage(
        "An error occurred during registration. Please try again."
      );
    }
  };

  const downloadPrivateKey = (privateKey: string) => {
    const element = document.createElement("a");
    const file = new Blob([privateKey], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `privateKey_${userName}.txt`;
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="flex items-center justify-center h-screen bg-[url('/imgs/login_bg_169.svg')] md:bg-[url('/imgs/login_bg_169.svg')] sm:bg-[url('/imgs/login_bg_916.svg')] bg-cover bg-center">
      <div className="bg-[#001f53] p-8 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-4xl font-bold text-center mb-4 underline decoration-purple-600">
          Create an Account
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="username"
              className="block text-sm font-medium text-[#ededed]"
            >
              Username
            </label>
            <input
              type="text"
              id="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-[#2b2d31] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="coolname123"
              required
            />
          </div>
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

          <div className="mb-4 relative">
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#ededed]"
            >
              Confirm Password
            </label>
            <input
              type={showConfirmPassword ? "text" : "password"}
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 text-[#2b2d31] border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="••••••••"
              required
            />
            <div
              className="absolute inset-y-0 right-0 pt-6 pr-3 flex items-center cursor-pointer"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <FaEyeSlash className="text-gray-500" />
              ) : (
                <FaEye className="text-gray-500" />
              )}
            </div>
          </div>

          {errorMessage && (
            <div className="mb-4 text-sm text-red-500">{errorMessage}</div>
          )}

          {successMessage && (
            <div className="mb-4 text-sm text-green-500">{successMessage}</div>
          )}

          <button
            type="submit"
            className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
          >
            Register
          </button>
        </form>

        <p className="text-sm text-center text-[#ededed] mt-7">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-purple-500 hover:text-purple-700 transition duration-200 transform"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
