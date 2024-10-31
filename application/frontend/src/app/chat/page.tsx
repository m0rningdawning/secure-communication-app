"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiLogout, HiUserGroup } from "react-icons/hi";

export default function ChatPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  return isAuthenticated ? (
    <div className="flex flex-col h-screen bg-[#00172e] relative">
      <header className="flex items-center justify-between p-4 bg-[#001846] text-white">
        <div className="text-lg font-semibold">ChatApp</div>
        <button
          onClick={logout}
          className="flex items-center space-x-2 text-sm hover:underline"
        >
          <HiLogout className="w-5 h-5" />
          <span>Logout</span>
        </button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden lg:flex flex-col w-64 bg-[#00236a] p-4">
          <h2 className="text-lg font-semibold mb-4">Users</h2>
          <ul className="flex-1 overflow-y-auto space-y-2">
            <li className="p-2 bg-[#5e199b] rounded hover:bg-[#6d2aa8] cursor-pointer">
              User 1
            </li>
            <li className="p-2 bg-[#5e199b] rounded hover:bg-[#6d2aa8] cursor-pointer">
              User 2
            </li>
            <li className="p-2 bg-[#5e199b] rounded hover:bg-[#6d2aa8] cursor-pointer">
              User 3
            </li>
          </ul>
          <button className="flex items-center mt-4 px-3 py-2 bg-[#5e199b] text-white rounded hover:bg-[#6d2aa8]">
            <HiUserGroup className="w-5 h-5 mr-2" />
            Add Recipient
          </button>
        </aside>

        <main className="flex flex-col flex-1 bg-center bg-no-repeat bg-cover bg-[url('/imgs/chat2_blur.png')]">
          <div className="flex items-center justify-between p-4 bg-blue-900 text-white">
            <h2 className="text-lg font-semibold">Chat with User 1</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <div className="self-start max-w-xs p-2 bg-[#002a54] rounded-lg">
              Hello!
            </div>
            <div className="self-end max-w-xs p-2 bg-blue-700 text-white rounded-lg">
              Hi there!
            </div>
          </div>

          <div className="p-4 bg-blue-900">
            <input
              type="text"
              placeholder="Type your message..."
              className="w-full p-2 rounded-lg bg-[#00172e] focus:outline-none focus:ring focus:ring-blue-300"
            />
          </div>
        </main>
      </div>

      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsDrawerOpen(false)}
        ></div>
      )}
      <div
        className={`fixed inset-y-0 right-0 transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 bg-[#00172e] w-3/4 md:hidden z-50`}
      >
        <header className="flex items-center justify-between p-4 bg-[#00236a]">
          <h2 className="text-xl font-bold">Users</h2>
          <button onClick={() => setIsDrawerOpen(false)}>Close</button>
        </header>
        <ul className="p-4 space-y-2">
          <li className="p-2 rounded bg-[#5e199b]">User 1</li>
          <li className="p-2 rounded bg-[#5e199b]">User 2</li>
          <li className="p-2 rounded bg-[#5e199b]">User 3</li>
        </ul>
        <button className="flex items-center mt-4 px-3 py-2 bg-[#5e199b] text-white rounded hover:bg-[#6d2aa8]">
          <HiUserGroup className="w-5 h-5 mr-2" />
          Add Recipient
        </button>
      </div>

      {!isDrawerOpen && (
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="fixed bottom-24 right-6 md:hidden p-3 rounded-full bg-blue-600 text-white shadow-lg z-50"
        >
          Users
        </button>
      )}
    </div>
  ) : null;
}
