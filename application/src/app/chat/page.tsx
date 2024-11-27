"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HiLogout, HiUserGroup, HiTrash } from "react-icons/hi";
import { encryptMessage, decryptMessage } from "@/lib/cryptoUtils";

// TODO
// Change the sending logic

export default function ChatPage() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientPublicKey, setRecipientPublicKey] = useState("");
  const [recipientUsername, setRecipientUsername] = useState("");
  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    if (!token || !userId) {
      router.push("/login");
    } else {
      setIsAuthenticated(true);
      fetchConversations(userId);
    }
  }, [router]);

  const fetchConversations = async (userId) => {
    try {
      const response = await fetch('/api/conversations', {
        headers: {
          'x-user-id': userId,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(data.conversations);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    router.push("/login");
  };

  const addRecipient = async () => {
    const userId = localStorage.getItem("userId");
    try {
      const response = await fetch(`/api/conversations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId, recipientEmail }),
      });
      const data = await response.json();
      if (response.ok) {
        setRecipientPublicKey(data.conversation.participants.find(p => p.id !== parseInt(userId)).publicKey);
        setRecipientUsername(data.conversation.participants.find(p => p.id !== parseInt(userId)).username);
        setCurrentConversationId(data.conversation.id);
        setShowAddRecipientModal(false);
        fetchConversations(userId);
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  };

  const deleteConversation = async (conversationId) => {
    try {
      const response = await fetch(`/api/conversations`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ conversationId }),
      });
      const data = await response.json();
      if (response.ok) {
        setConversations(conversations.filter(c => c.id !== conversationId));
        setCurrentConversationId(null);
        setMessages([]);
        setRecipientUsername("");
      } else {
        console.error(data.message);
      }
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!recipientPublicKey || !currentConversationId) {
      console.error("Recipient public key or conversation ID not set");
      return;
    }

    const encryptedMessage = await encryptMessage(recipientPublicKey, message);

    const response = await fetch('/api/messages/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ conversationId: currentConversationId, message: encryptedMessage }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error(data.message);
    } else {
      setMessages([...messages, { senderId: 1, content: encryptedMessage }]);
    }
  };

  const receiveMessage = async (encryptedMessage: string) => {
    const privateKey = localStorage.getItem('privateKey');
    if (!privateKey) {
      throw new Error('Private key not found');
    }

    const message = await decryptMessage(privateKey, encryptedMessage);
    setMessages([...messages, { senderId: 2, content: message }]);
  };

  return isAuthenticated ? (
    <div className="flex flex-col h-screen bg-[#00172e] relative">
      <header className="flex items-center justify-between p-4 bg-[#001846] text-white">
        <div className="text-lg font-semibold">
          <span className="text-purple-600">Secure</span> Chat
        </div>
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
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <ul className="flex-1 overflow-y-auto space-y-2">
            {conversations.map((conversation) => (
              <li
                key={conversation.id}
                className="p-2 bg-[#5e199b] rounded hover:bg-[#6d2aa8] cursor-pointer flex justify-between items-center"
                onClick={() => {
                  setCurrentConversationId(conversation.id);
                  setRecipientUsername(conversation.participants.find(p => p.id !== parseInt(localStorage.getItem("userId"))).username);
                  setMessages(conversation.messages);
                }}
              >
                <span>{conversation.participants.find(p => p.id !== parseInt(localStorage.getItem("userId"))).username}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteConversation(conversation.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <HiTrash className="w-5 h-5" />
                </button>
              </li>
            ))}
          </ul>
          <button
            onClick={() => setShowAddRecipientModal(true)}
            className="flex items-center mt-4 px-3 py-2 bg-[#5e199b] text-white rounded hover:bg-[#6d2aa8]"
          >
            <HiUserGroup className="w-5 h-5 mr-2" />
            Add Recipient
          </button>
        </aside>

        <main className="flex flex-col flex-1 bg-center bg-no-repeat bg-cover bg-[url('/imgs/chat2_blur.png')]">
          <div className="flex items-center justify-between p-4 bg-opacity-90 backdrop-blur-3xl shadow-md">
            <h2 className="text-lg font-semibold text-white">
              Chat with {recipientUsername}
            </h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`self-${msg.senderId === 1 ? 'end' : 'start'} max-w-xs p-2 ${msg.senderId === 1 ? 'bg-blue-700 text-white' : 'bg-[#002a54]'} rounded-lg`}
              >
                {msg.content}
              </div>
            ))}
          </div>

          <div className="p-4 bg-opacity-90 backdrop-blur-3xl shadow-md">
            <input
              type="text"
              placeholder="Type your message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="w-full p-2 rounded-lg bg-[#00236a] focus:outline-none focus:ring focus:ring-blue-300"
            />
            <button
              onClick={() => sendMessage(newMessage)}
              className="mt-2 w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Send
            </button>
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

      {showAddRecipientModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Add Recipient</h2>
            <input
              type="email"
              placeholder="Recipient's email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full p-2 mb-4 border rounded-lg"
            />
            <button
              onClick={addRecipient}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Add
            </button>
            <button
              onClick={() => setShowAddRecipientModal(false)}
              className="mt-2 w-full bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition duration-200 transform hover:scale-105 focus:scale-105"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  ) : null;
}