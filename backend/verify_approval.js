const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyApprovalFlow() {
    try {
        console.log('--- Starting Verification: Bidder Approval ---');

        // 1. Register Seller
        const sellerRes = await axios.post(`${API_URL}/auth/register`, {
            username: `seller_${Date.now()}`,
            email: `seller_${Date.now()}@test.com`,
            password: 'password123',
            role: 'seller'
        });
        const sellerToken = sellerRes.data.token;
        console.log('1. Seller registered');

        // 2. Register Buyer
        const buyerRes = await axios.post(`${API_URL}/auth/register`, {
            username: `buyer_${Date.now()}`,
            email: `buyer_${Date.now()}@test.com`,
            password: 'password123',
            role: 'buyer'
        });
        const buyerToken = buyerRes.data.token;
        const buyerId = buyerRes.data._id;
        console.log('2. Buyer registered');

        // 3. Create Auction
        const auctionRes = await axios.post(`${API_URL}/auctions`, {
            title: 'Approval Test Item',
            description: 'Test item',
            startingPrice: 100,
            endTime: new Date(Date.now() + 3600000).toISOString()
        }, { headers: { Authorization: `Bearer ${sellerToken}` } });
        const auctionId = auctionRes.data._id;
        console.log('3. Auction created');

        // 4. Buyer tries to bid (Should Fail)
        try {
            await axios.post(`${API_URL}/auctions/${auctionId}/bid`, { amount: 110 }, {
                headers: { Authorization: `Bearer ${buyerToken}` }
            });
            console.error('ERROR: Buyer bid without approval!');
        } catch (err) {
            if (err.response?.status === 403) {
                console.log('4. Success: Unapproved bid blocked (403)');
            } else {
                console.error('Unexpected error:', err.message);
            }
        }

        // 5. Buyer requests access
        await axios.post(`${API_URL}/auctions/${auctionId}/request-access`, {}, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        console.log('5. Access requested');

        // 6. Seller approves buyer
        await axios.post(`${API_URL}/auctions/${auctionId}/approve`, { userId: buyerId }, {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        console.log('6. Seller approved buyer');

        // 7. Buyer tries to bid again (Should Success)
        await axios.post(`${API_URL}/auctions/${auctionId}/bid`, { amount: 110 }, {
            headers: { Authorization: `Bearer ${buyerToken}` }
        });
        console.log('7. Success: Approved bid placed!');

        console.log('\n--- Verification Complete ---');

    } catch (error) {
        console.error('Verification Failed:', error.response ? error.response.data : error.message);
    }
}

verifyApprovalFlow();
