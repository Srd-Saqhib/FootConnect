import React, { useState } from "react";
import "../styles/login.css";
import axios from "axios";

function Login(props) {
    const [error, setError] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const res = await axios.post("/api/login", {
                email,
                password: password.trim()
            });

            setError("");
            if (res.data.success) {
                props.onSuccess && props.onSuccess(res.data.user);
            }
        } catch (err) {
            setError(
                err.response?.data?.message || "Server error. Try again."
            );
        }
    }

    return <div className="login-container">
        <h2>Football Community</h2>

        <form onSubmit={handleSubmit}>
            <input onChange={(e) => setEmail(e.target.value)} value={email} type="email" placeholder="Email" required />
            <input onChange={(e) => setPassword(e.target.value)} value={password} type="password" placeholder="Password" required />

            <button type="submit">Login</button>
            {error && <p className="error">{error}</p>}

            <p className="text">
                Don’t have an account?
                <a href="#">Register</a>
            </p>
        </form>
    </div>
}

export default Login;