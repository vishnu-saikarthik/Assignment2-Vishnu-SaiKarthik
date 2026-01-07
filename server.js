import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import uploadRoutes from './routes/upload.routes.js';

// Load environment variables
dotenv.config();

const app = express();

// HARD CODED FIX: Force Port 4000. 
// The .env file likely has PORT=3000 which is causing a conflict/mismatch.
const PORT = 4000;

// ES6 Fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', uploadRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'active',
    system: 'LegalTech Document Verification API',
    version: '1.0.1'
  });
});

app.use((err, req, res, next) => {
  console.error('Unhandled Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: err.message
  });
});

// START SERVER
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🚀 LegalTech Document Verification System running on http://localhost:${PORT}`);
  console.log(`📁 Uploads directory: ${uploadDir}`);
  console.log(`Using OpenAI API Key: ${process.env.OPENAI_API_KEY ? '******' + process.env.OPENAI_API_KEY.slice(-4) : 'MISSING'}\n`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.log('Error: Port ' + PORT + ' is already in use!');
    console.log('Please stop the other process.');
    process.exit(1);
  } else {
    console.log(e);
  }
});
