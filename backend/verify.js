const axios = require('axios');

const API_URL = 'http://localhost:5000/api';
let token;
let auctionId;

const runVerification = async () => {
    try {
        console.log('--- Starting Verification ---');

        // 1. Register User
        console.log('\n1. Registering User...');
        const user = {
            username: 'testuser_' + Date.now(),
            email: `test_${Date.now()}@example.com`,
            password: 'password123',
        };
        try {
            const regRes = await axios.post(`${API_URL}/auth/register`, user);
            console.log('✅ Registration successful:', regRes.data.username);
            token = regRes.data.token;
        } catch (e) {
            console.error('❌ Registration failed:', e.response?.data || e.message);
            return;
        }

        // 2. Create Auction
        console.log('\n2. Creating Auction...');
        const auction = {
            title: 'Test Auction Item',
            description: 'A very valuable item',
            startingPrice: 100,
            endTime: new Date(Date.now() + 60000).toISOString(), // Ends in 1 minute
        };
        try {
            const aucRes = await axios.post(`${API_URL}/auctions`, auction, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('✅ Auction created:', aucRes.data.title);
            auctionId = aucRes.data._id;
        } catch (e) {
            console.error('❌ Auction creation failed:', e.response?.data || e.message);
            return;
        }

        // 3. Place Bid
        console.log('\n3. Placing Bid...');
        const bid = { amount: 150 };
        try {
            const bidRes = await axios.post(`${API_URL}/auctions/${auctionId}/bid`, bid, {
                headers: { Authorization: `Bearer ${token}` },
            });
            console.log('✅ Bid placed successfully. New Price:', bidRes.data.currentPrice);
        } catch (e) {
            console.error('❌ Bid placement failed:', e.response?.data || e.message);
            return;
        }

        // 4. Verify Auction Details
        console.log('\n4. Verifying Auction Details...');
        try {
            const getRes = await axios.get(`${API_URL}/auctions/${auctionId}`);
            if (getRes.data.currentPrice === 150) {
                console.log('✅ Verification Successful: Price is updated.');
            } else {
                console.error('❌ Verification Failed: Price mismatch.');
            }
        } catch (e) {
            console.error('❌ Get auction failed:', e.response?.data || e.message);
        }

        console.log('\n--- Verification Complete ---');
    } catch (error) {
        console.error('Unexpected error:', error);
    }
};

runVerification();
