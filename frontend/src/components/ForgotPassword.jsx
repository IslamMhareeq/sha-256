import { useState } from 'react';
import { forgotPassword } from '../services/api';

export default function ForgotPassword() {
  const [username,  setUsername]  = useState('');
  const [resetLink, setResetLink] = useState(null);

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      const { data } = await forgotPassword({ username });
      alert(data.message);
      setResetLink(data.resetLink);
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <input
          name="username"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <button type="submit">Send Reset Link</button>
      </form>
      {resetLink && (
        <p>
          <strong>Your reset link:</strong><br/>
          <a href={resetLink}>{resetLink}</a>
        </p>
      )}
    </>
  );
}
