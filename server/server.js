const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017';
const DB_NAME = process.env.DB_NAME || 'pawpal';
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret-before-deployment-pawpal';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

let pets;
let users;

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ message: 'Please log in to manage pet listings.' });
  try { req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch { return res.status(401).json({ message: 'Your session expired. Please log in again.' }); }
}

function cleanPet(body) {
  const allowed = ['name', 'type', 'breed', 'age', 'sex', 'location', 'status', 'image', 'description'];
  const pet = {};
  for (const key of allowed) if (body[key] !== undefined) pet[key] = body[key];
  if (pet.name !== undefined) pet.name = String(pet.name).trim();
  if (pet.type !== undefined) pet.type = String(pet.type).trim();
  if (pet.breed !== undefined) pet.breed = String(pet.breed).trim();
  if (pet.location !== undefined) pet.location = String(pet.location).trim();
  if (pet.status !== undefined && !['Available', 'Adopted'].includes(pet.status)) {
    throw new Error('Status must be Available or Adopted.');
  }
  if (pet.age !== undefined) {
    pet.age = Number(pet.age);
    if (!Number.isFinite(pet.age) || pet.age < 0 || pet.age > 40) throw new Error('Age must be between 0 and 40.');
  }
  return pet;
}

app.get('/api/health', (req, res) => res.json({ ok: true, database: DB_NAME }));

app.post('/api/auth/signup', async (req, res) => {
  try {
    const name = String(req.body.name || '').trim();
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, and password are required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter a valid email address.' });
    if (password.length < 8) return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    if (await users.findOne({ email })) return res.status(409).json({ message: 'An account with this email already exists. Please log in.' });
    const user = { name, email, passwordHash: await bcrypt.hash(password, 12), createdAt: new Date() };
    const result = await users.insertOne(user);
    const token = jwt.sign({ userId: result.insertedId.toString(), name, email }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { name, email } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not create account.' }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = String(req.body.password || '');
    const user = await users.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
    const token = jwt.sign({ userId: user._id.toString(), name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (error) { console.error(error); res.status(500).json({ message: 'Could not log in right now.' }); }
});


app.get('/api/pets', async (req, res) => {
  try {
    const allPets = await pets.find({}).sort({ createdAt: -1 }).toArray();
    res.json(allPets);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Could not load pet listings.' });
  }
});

app.post('/api/pets', requireAuth, async (req, res) => {
  try {
    const pet = cleanPet(req.body);
    for (const field of ['name', 'type', 'breed', 'age', 'location', 'status']) {
      if (pet[field] === undefined || pet[field] === '') return res.status(400).json({ message: `${field} is required.` });
    }
    pet.sex = pet.sex || 'Not specified';
    pet.image = pet.image || '';
    pet.description = pet.description || '';
    pet.createdAt = new Date();
    const result = await pets.insertOne(pet);
    res.status(201).json({ ...pet, _id: result.insertedId });
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not create pet listing.' });
  }
});

app.put('/api/pets/:id', requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid pet ID.' });
    const updates = cleanPet(req.body);
    delete updates._id;
    delete updates.createdAt;
    const result = await pets.updateOne({ _id: new ObjectId(req.params.id) }, { $set: updates });
    if (!result.matchedCount) return res.status(404).json({ message: 'Pet listing not found.' });
    res.json(await pets.findOne({ _id: new ObjectId(req.params.id) }));
  } catch (error) {
    res.status(400).json({ message: error.message || 'Could not update pet listing.' });
  }
});

app.delete('/api/pets/:id', requireAuth, async (req, res) => {
  try {
    if (!ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid pet ID.' });
    const result = await pets.deleteOne({ _id: new ObjectId(req.params.id) });
    if (!result.deletedCount) return res.status(404).json({ message: 'Pet listing not found.' });
    res.json({ message: 'Pet listing deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Could not delete pet listing.' });
  }
});

async function start() {
  const client = new MongoClient(MONGODB_URI);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    pets = db.collection('pets');
    users = db.collection('users');
    await users.createIndex({ email: 1 }, { unique: true });
    await pets.createIndex({ status: 1 });
    app.listen(PORT, () => {
      console.log(`🐾 PawPal API running at http://localhost:${PORT}`);
      console.log(`MongoDB connected. Database: ${DB_NAME}, collection: pets`);
    });
  } catch (error) {
    console.error('Could not connect to MongoDB.');
    console.error('Make sure MongoDB Server is installed and running, then try again.');
    console.error(error.message);
    process.exit(1);
  }
}
start();
