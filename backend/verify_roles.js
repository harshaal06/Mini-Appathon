const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function verifyRolesAndImages() {
    try {
        console.log('--- Starting Verification: Roles & Images ---');

        // 1. Register a Seller
        console.log('\n1. Registering Seller...');
        const sellerRes = await axios.post(`${API_URL}/auth/register`, {
            username: `seller_${Date.now()}`,
            email: `seller_${Date.now()}@test.com`,
            password: 'password123',
            role: 'seller'
        });
        const sellerToken = sellerRes.data.token;
        console.log('Seller registered:', sellerRes.data.role);

        // 2. Register a Buyer
        console.log('\n2. Registering Buyer...');
        const buyerRes = await axios.post(`${API_URL}/auth/register`, {
            username: `buyer_${Date.now()}`,
            email: `buyer_${Date.now()}@test.com`,
            password: 'password123',
            role: 'buyer'
        });
        const buyerToken = buyerRes.data.token;
        console.log('Buyer registered:', buyerRes.data.role);

        // 3. Seller Creates Auction with Image
        console.log('\n3. Seller creating auction with image...');
        const auctionData = {
            title: 'Vintage Camera',
            description: 'A classic film camera.',
            startingPrice: 100,
            endTime: new Date(Date.now() + 3600000).toISOString(),
            image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-1.2.1&auto=format&fit=crop&w=1000&q=80'
        };

        const auctionRes = await axios.post(`${API_URL}/auctions`, auctionData, {
            headers: { Authorization: `Bearer ${sellerToken}` }
        });
        console.log('Auction created with image:', auctionRes.data.image);

        // 4. Buyer Tries to Create Auction (Should Fail)
        console.log('\n4. Buyer trying to create auction (Expect 403)...');
        try {
            await axios.post(`${API_URL}/auctions`, auctionData, {
                headers: { Authorization: `Bearer ${buyerToken}` }
            });
            console.error('ERROR: Buyer was able to create auction!');
        } catch (error) {
            if (error.response && error.response.status === 403) {
                console.log('Success: Buyer blocked from creating auction (403 Forbidden).');
            } else {
                console.error('Unexpected error:', error.message);
            }
        }

        console.log('\n--- Verification Complete ---');

    } catch (error) {
        console.error('Verification Failed:', error.response ? error.response.data : error.message);
    }
}

verifyRolesAndImages();
