// src/components/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers } from '../services/api';

function parseJwt(token) {
  // take the payload part
  let base64Url = token.split('.')[1];
  // make base64 standard
  let base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  // add padding if missing
  while (base64.length % 4) {
    base64 += '=';
  }
  // decode & parse
  return JSON.parse(atob(base64));
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [role, setRole]         = useState('');
  const [users, setUsers]       = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    let payload;
    try {
      payload = parseJwt(token);
      setUsername(payload.username);
      setRole(payload.role);
    } catch (err) {
      console.error('JWT parsing error:', err);
      navigate('/login');
      return;
    }

    if (payload.role === 'admin') {
      getUsers()
        .then(({ data }) => setUsers(data))
        .catch(() => {
          localStorage.removeItem('token');
          navigate('/login');
        });
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div>
      <h2>Welcome, {username}!</h2>
      <p>Your role: <strong>{role}</strong></p>
      <button onClick={handleLogout}>Logout</button>

      {role === 'admin' && users.length > 0 && (
        <>
          <h3>All Users</h3>
          <table
            border="1"
            cellPadding="6"
            style={{ borderCollapse: 'collapse', marginTop: '16px' }}
          >
            <thead>
              <tr>
                <th>Username</th>
                <th>Role</th>
                <th>First Name</th>
                <th>Last Name</th>
                <th>ID Number</th>
                <th>Card Number</th>
                <th>Valid Date</th>
                <th>CVC</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.username}>
                  <td>{user.username}</td>
                  <td>{user.role}</td>
                  <td>{user.first_name}</td>
                  <td>{user.last_name}</td>
                  <td>{user.id_number}</td>
                  <td>{user.credit_card_number}</td>
                  <td>{user.valid_date}</td>
                  <td>{user.cvc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
