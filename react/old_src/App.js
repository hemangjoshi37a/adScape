import React, { useState } from 'react'
import { Client } from 'appwrite'

const client = new Client()

client.setEndpoint('http://0.0.0.0/v1').setProject('63c0f14b179fcdd12c52')
function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async event => {
    event.preventDefault();
    try {
      const response = await client.account.createSession({
        email: email,
        password: password,
      });
      localStorage.setItem('user', JSON.stringify(response.getData()));
    } catch (err) {
      console.error(err);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const response = await client.auth.createSessionWithOAuth({
        provider: 'google',
        token: 'YOUR_GOOGLE_OAUTH_TOKEN',
      });
      localStorage.setItem('user', JSON.stringify(response.getData()));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email:
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </label>
      <br />
      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </label>
      <button type="submit">Login</button>
      <button type="button" onClick={handleGoogleLogin}>
        Login with Google
      </button>
    </form>
  );
}

function ProfilePage() {
  const user = JSON.parse(localStorage.getItem('user'))
  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <p>Email: {user.email}</p>
    </div>
  )
}



const SignupPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const client = new Client()
  client.setEndpoint('http://0.0.0.0/v1')
  client.setProject('63c0f14b179fcdd12c52')
  const handleSubmit = async event => {
    event.preventDefault();
    try {
      await client.account.create({
        email,
        password
      });
      alert('Successfully created account! Please login.');
    } catch (err) {
      console.error(err);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <label>
        Email:
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
      </label>
      <br />
      <label>
        Password:
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
      </label>
      <button type="submit">Sign Up</button>
    </form>
  );
}

export { LoginPage, ProfilePage, SignupPage }
