const express = require('express');
const serverless = require('serverless-http');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();
const router = express.Router();

const { getLastFridayOrNonHolidayDate, dateToUnixTimestampPlusADay, dateToUnixTimestamp, formatDateToMatchApiArgument } = require('./helpers.js');

const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Mobile Safari/537.36',
}

router.get('/', (req, res) => {
    res.json('Welcome to the cryptocurrency funding rates API');
});

router.get('/fundingrate/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const url = `https://www.coinglass.com/FundingRate/${symbol}`;

        const response = await axios.get(url, { headers });
        const html = response.data;
        const $ = cheerio.load(html);

        const fundingRates = [];

        $('.table-container table tbody tr').each((index, element) => {
            const row = $(element);
            const exchange = row.find('td:nth-child(1)').text().trim();
            const fundingRate = row.find('td:nth-child(2)').text().trim();
            const estimatedRate = row.find('td:nth-child(3)').text().trim();
            const rateChange = row.find('td:nth-child(4)').text().trim();

            fundingRates.push({
                exchange,
                fundingRate,
                estimatedRate,
                rateChange
            });
        });

        if (fundingRates.length > 0) {
            res.json(fundingRates);
        } else {
            res.status(404).send('Funding rates not found.');
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Credentials', true);
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use('/.netlify/functions/cryptoinfo', router);

module.exports.handler = serverless(app);

// Remove commented code from below for local testing
// module.exports = router;
