"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ChatPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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
    <div className="flex h-screen bg-[#00172e]">
      <aside className="hidden md:flex flex-col w-1/4 bg-[#00172e] shadow-lg p-4">
        <h2 className="text-xl font-bold mb-4">Users</h2>
        <button className="text-blue-600 mb-2">Add Recipient</button>
        <ul className="flex-1 overflow-y-auto space-y-2">
          <li className="p-2 rounded bg-[#5e199b]">User 1</li>
          <li className="p-2 rounded bg-[#5e199b]">User 2</li>
          <li className="p-2 rounded bg-[#5e199b]">User 3</li>
        </ul>
      </aside>

      <main className="flex-1 flex flex-col">
        <header className="flex items-center justify-between bg-[#001f53] text-white p-4 shadow">
          <div className="text-2xl font-bold">ChatApp</div>
          <button
            onClick={logout}
            className="px-3 py-1 rounded bg-[#5e199b] hover:bg-[#4e1c7a]"
          >
            Logout
          </button>
        </header>

        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[url('/imgs/chat-alt.svg')] bg-cover bg-center">
          <div className="self-start bg-[#3f1067] p-3 rounded-lg max-w-sm">
            Message from User 1
          </div>
          <div className="self-end bg-[#3f1067] p-3 rounded-lg max-w-sm">
            My message
          </div>
        </div>

      <footer className="p-4 bg-[#001f53]">
          <div className="flex">
            <input
              type="text"
              placeholder="Type a message..."
              className="flex-1 p-2 rounded-l-lg bg-[#5e199b]"
            />
            <button className="px-4 py-2 bg-[#5e199b] hover:bg-[#4e1c7a]  rounded-r-lg">
              Send
            </button>
          </div>
        </footer>
      </main>

      <div
        className={`fixed inset-y-0 right-0 transform ${
          isDrawerOpen ? "translate-x-0" : "translate-x-full"
        } transition-transform duration-300 bg-[#00172e] w-3/4 md:hidden`}
      >
        <header className="flex items-center justify-between p-4 bg-[#00172e] border-b">
          <h2 className="text-xl font-bold">Users</h2>
          <button onClick={() => setIsDrawerOpen(false)}>Close</button>
        </header>
        <ul className="p-4 space-y-2">
          <li className="p-2 rounded bg-blue-100">User 1</li>
          <li className="p-2 rounded bg-blue-100">User 2</li>
          <li className="p-2 rounded bg-blue-100">User 3</li>
        </ul>
      </div>

      <button
        onClick={() => setIsDrawerOpen(true)}
        className="fixed bottom-4 right-4 md:hidden p-3 rounded-full bg-blue-600 text-white shadow-lg"
      >
        Users
      </button>
    </div>
  ) : null;
}
