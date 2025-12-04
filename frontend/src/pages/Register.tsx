import { API_BASE } from "@/config";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.msg || "Registration failed");
      return;
    }

    alert("✅ Account created! You can now log in.");
    navigate("/");
  };

  return (
    <form onSubmit={handleRegister} className="max-w-md mx-auto mt-20 space-y-4 p-6 bg-white dark:bg-[#1A1F2C] rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-primary dark:text-white">Sign Up</h2>

      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
      />

      <input
        type="password"
        placeholder="Password (min 6 characters)"
        value={password}
        onChange={e => setPassword(e.target.value)}
        required
        className="w-full p-2 border rounded-md dark:bg-gray-800 dark:text-white"
      />

      <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded">
        Create Account
      </button>
    </form>
  );
};

export default Register;
