require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const express = require('express')
const app = express()
const cors = require('cors')
const path = require('path')
const { google } = require('googleapis')
const PORT = process.env.PORT | 5000
app.use(express.json())
app.use(cors({
    origin: '*'
}));
const CLIENT_ID = process.env.CLIENT_ID
const CLIENT_SECRET = process.env.CLIENT_SECRET
const REDIRECT_URI = process.env.REDIRECT_URI
const REFRESH_TOKEN = process.env.REFRESH_TOKEN

const authoclient = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    REDIRECT_URI
)
authoclient.setCredentials({ refresh_token: REFRESH_TOKEN })
const drive = google.drive({
    version: 'v3',
    auth: authoclient
})
const filepath = path.join(__dirname, 'polly.mp3')

const uploadFile = async () => {
    try {
        const res = await drive.files.create({
            requestBody: {
                name: 'polly.mp3',
                mimeType: 'audio/mpeg'
            },
            media: {
                mimeType: 'audio/mpeg',
                body: fs.createReadStream(filepath)
            }
        })
        const id = res.data.id
        return id
    } catch (error) {
        console.log(error);
    }
}

// polly service
const polly = new AWS.Polly({
    region: 'us-east-1',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_KEY,
    sessionToken: process.env.SESSION_TOKEN,
})

app.post('/speak', (req, res) => {
    const data = req.body

    const input = {
        Text: data.text,
        OutputFormat: 'mp3',
        VoiceId: data.voice
    }
    polly.synthesizeSpeech(input, async (err, data) => {
        if (err) {
            res.send(err)
        }
        if (data.AudioStream instanceof Buffer) {

            fs.writeFile('polly.mp3', data.AudioStream, (err, result) => {
                if (err) {
                    res.send(err)
                }
            })
            const id = await uploadFile()
            // await drive.permissions.create({
            //     fileId: id,
            //     requestBody: {
            //         role: 'reader',
            //         type: 'anyone'
            //     }
            // })
            // const result = await drive.files.get({
            //     fileId: id,
            //     fields: 'webViewLink,webContentLink'
            // })

            res.send(id)
        }
    })
})


app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
})