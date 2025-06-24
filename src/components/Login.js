import React, { useState } from 'react';

function Login({ onLogin }) {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim()) {
      onLogin(input.trim());
    }
  };

  return (
    <form className="login-placeholder" onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Enter UserID"
        value={input}
        onChange={e => setInput(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
