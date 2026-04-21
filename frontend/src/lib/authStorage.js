const USERS_KEY = "healthchain-users";
const SESSION_KEY = "healthchain-session";

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function getStoredUsers() {
  const users = readJson(USERS_KEY, []);
  return Array.isArray(users) ? users : [];
}

export function getCurrentUser() {
  const session = readJson(SESSION_KEY, null);
  if (!session?.email) return null;

  const user = getStoredUsers().find((item) => item.email === session.email);
  if (!user) return null;

  const { password, ...safeUser } = user;
  return safeUser;
}

export function registerUser({ name, email, password, role }) {
  const normalizedEmail = normalizeEmail(email);
  const users = getStoredUsers();

  if (users.some((user) => user.email === normalizedEmail)) {
    throw new Error("An account with this email already exists.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: String(name || "").trim(),
    email: normalizedEmail,
    password,
    role,
    createdAt: new Date().toISOString(),
  };

  writeJson(USERS_KEY, [...users, user]);
  writeJson(SESSION_KEY, { email: user.email });

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function loginUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const user = getStoredUsers().find((item) => item.email === normalizedEmail);

  if (!user || user.password !== password) {
    throw new Error("Invalid email or password.");
  }

  writeJson(SESSION_KEY, { email: user.email });

  const { password: _password, ...safeUser } = user;
  return safeUser;
}

export function logoutUser() {
  localStorage.removeItem(SESSION_KEY);
}
