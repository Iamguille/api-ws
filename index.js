const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox'],
        headless: true,
    },
    authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('auth_failure', msg => {
    console.error('AUTHENTICATION FAILURE', msg);
});

client.on('disconnected', (reason) => {
    console.log('Client was logged out', reason);
});

client.initialize();

app.post('/send-pdf', async (req, res) => {
    const { number, message, pdfPath } = req.body;

    if (!number || !message || !pdfPath) {
        return res.status(400).json({ success: false, error: 'Missing number, message, or pdfPath parameter' });
    }

    if (!fs.existsSync(pdfPath)) {
        return res.status(404).json({ success: false, error: 'PDF file not found' });
    }

    const media = MessageMedia.fromFilePath(pdfPath);
    client.sendMessage(number, media, { caption: message }).then(response => {
        res.status(200).json({ success: true, response });
    }).catch(err => {
        console.error('Error sending PDF:', err);
        res.status(500).json({ success: false, err });
    });
});

app.post('/send-message', (req, res) => {
    const { number, message } = req.body;

    client.sendMessage(number, message).then(response => {
        res.json({ success: true, response });
    }).catch(err => {
        res.json({ success: false, err });
    });
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
