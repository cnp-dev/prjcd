const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas Connection
const mongoURI = 'mongodb+srv://ravi191203:admin191203@codestorage.pzfd3.mongodb.net/?retryWrites=true&w=majority&appName=CodeStorage';
mongoose.connect(mongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('Connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Code Schema
const codeSchema = new mongoose.Schema({
    language: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Code = mongoose.model('Code', codeSchema);

// Simple admin password
const ADMIN_PASSWORD = 'admin123';

// Middleware to check if user is authenticated as admin
const isAdminAuthenticated = (req, res, next) => {
    const isAuthenticated = req.headers['x-admin-auth'] === 'true' || req.query.adminAuth === 'true';
    if (isAuthenticated) {
        return next();
    }
    res.status(401).send('Unauthorized: Please log in as admin');
};

// Routes
app.get('/api/codes/:language', async (req, res) => {
    try {
        const codes = await Code.find({ language: req.params.language }).sort({ createdAt: -1 });
        res.json(codes);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/api/languages', async (req, res) => {
    try {
        const languages = await Code.distinct('language');
        res.json(languages);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/api/codes', async (req, res) => {
    const { language, title, content } = req.body;
    if (!language || !title || !content) return res.status(400).send('Missing fields: language, title, and content are required');

    try {
        const newCode = new Code({ language, title, content });
        await newCode.save();
        res.status(201).json(newCode);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.delete('/api/codes/:id', async (req, res) => {
    try {
        const deletedCode = await Code.findByIdAndDelete(req.params.id);
        if (!deletedCode) return res.status(404).send('Code not found');
        res.send('Code deleted');
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Admin login endpoint
app.post('/admin-login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Incorrect password' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', isAdminAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

app.use((req, res) => {
    res.status(404).send('Page not found');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});