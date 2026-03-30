import { useState } from "react";
import axios from "axios";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const BASE_URL = import.meta.env.VITE_API_URL;

  const login = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/login`, {
        username,
        password,
      });

      localStorage.setItem("token", res.data.access_token);

      window.location.href = "/";
    } catch (err) {
      alert("Login failed");
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 50 }}>
      <h2>Login</h2>

      <input
        placeholder="Username"
        onChange={(e) => setUsername(e.target.value)}
      />
      <br />

      <input
        type="password"
        placeholder="Password"
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />

      <button onClick={login}>Login</button>
    </div>
  );
}