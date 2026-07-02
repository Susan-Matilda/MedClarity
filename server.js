const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const users = [];

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
  }
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'medclarity-session-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ ok: false, message: 'Please sign in first.' });
}

app.post('/signup', (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ ok: false, message: 'Name, email, and password are required.' });
  }

  const existingUser = users.find(user => user.email.toLowerCase() === email.toLowerCase());
  if (existingUser) {
    return res.status(409).json({ ok: false, message: 'An account with this email already exists.' });
  }

  const newUser = {
    id: Date.now().toString(),
    name: name.trim(),
    email: email.trim().toLowerCase(),
    password: password.trim()
  };

  users.push(newUser);
  req.session.user = { id: newUser.id, name: newUser.name, email: newUser.email };

  return res.json({ ok: true, user: req.session.user, redirectTo: '/dashboard' });
});

app.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email and password are required.' });
  }

  const user = users.find(entry => entry.email.toLowerCase() === email.toLowerCase());
  if (!user || user.password !== password) {
    return res.status(401).json({ ok: false, message: 'Incorrect email or password.' });
  }

  req.session.user = { id: user.id, name: user.name, email: user.email };
  return res.json({ ok: true, user: req.session.user, redirectTo: '/dashboard' });
});

app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ ok: false, message: 'Unable to log out right now.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ ok: true, redirectTo: '/' });
  });
});

app.get('/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({ ok: true, user: req.session.user });
  }
  return res.status(401).json({ ok: false, message: 'Not logged in.' });
});

app.get('/dashboard', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`MedClarity server running on http://localhost:${PORT}`);
});
