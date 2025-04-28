// src/components/Register.jsx
import { useState } from 'react';
import { register } from '../services/api';
import { useNavigate } from 'react-router-dom';

export default function Register() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    role: 'user',
    first_name: '',
    last_name: '',
    id_number: '',
    credit_card_number: '',
    valid_date: '',
    cvc: '',
  });
  const navigate = useNavigate();

  const handleChange = e =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      await register(form);
      alert('Registered successfully!');
      navigate('/login');
    } catch (err) {
      alert(err.response?.data?.error || err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Register</h2>

      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
        required
      />
      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />

      <label>
        Role:
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
      </label>

      <input
        name="first_name"
        placeholder="First Name"
        value={form.first_name}
        onChange={handleChange}
        pattern="[A-Za-z]+"
        title="Only letters allowed"
        required
      />
      <input
        name="last_name"
        placeholder="Last Name"
        value={form.last_name}
        onChange={handleChange}
        pattern="[A-Za-z]+"
        title="Only letters allowed"
        required
      />
      <input
        name="id_number"
        placeholder="ID Number (9 digits)"
        value={form.id_number}
        onChange={handleChange}
        pattern="\d{9}"
        title="9 digits"
        required
      />
      <input
        name="credit_card_number"
        placeholder="Card Number (XXXX XXXX XXXX XXXX)"
        value={form.credit_card_number}
        onChange={handleChange}
        pattern="\d{4} \d{4} \d{4} \d{4}"
        title="Format: 1234 5678 9012 3456"
        required
      />
      <input
        name="valid_date"
        placeholder="Valid Date (MM/YY)"
        value={form.valid_date}
        onChange={handleChange}
        pattern="(0[1-9]|1[0-2])\/\d{2}"
        title="Format: MM/YY"
        required
      />
      <input
        name="cvc"
        placeholder="CVC (3 digits)"
        value={form.cvc}
        onChange={handleChange}
        pattern="\d{3}"
        title="3 digits"
        required
      />

      <button type="submit">Sign Up</button>
    </form>
  );
}
