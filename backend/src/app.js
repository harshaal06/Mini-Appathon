const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*", // Allow all origins for MVP
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/auctions', require('./routes/auctionRoutes'));

app.get('/', (req, res) => {
    res.send('Smart Auction Platform API is running');
});

// Socket.io Connection
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('joinAuction', (auctionId) => {
        socket.join(auctionId);
        console.log(`Client joined auction room: ${auctionId}`);
    });

    socket.on('leaveAuction', (auctionId) => {
        socket.leave(auctionId);
        console.log(`Client left auction room: ${auctionId}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Make io accessible in routes
app.set('io', io);

// Start Cron Jobs
const startAuctionCron = require('./utils/cronJobs');
startAuctionCron(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
