require('dotenv').config()
const AWS = require('aws-sdk')
const fs = require('fs')
const express = require('express')
const app = express()
const PORT = process.env.PORT | 3000
app.use(express.json())

const polly = new AWS.Polly({
    region: 'us-east-1',
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_KEY,
    sessionToken: process.env.SESSION_TOKEN,
})

app.post('/speak', (req, res) => {
    const { text, voice } = req.body

    const input = {
        Text: text,
        OutputFormat: 'mp3',
        VoiceId: voice
    }
    polly.synthesizeSpeech(input, (err, data) => {
        if (err) {
            res.send(err)
        }
        if (data.AudioStream instanceof Buffer) {
            fs.writeFile('polly.mp3', data.AudioStream, (err, result) => {
                if (err) {
                    res.send(err)
                } else {
                    res.sendFile(__dirname + "/polly.mp3")
                }
            }) 
        }
    })
})

app.listen(PORT, () => {
    console.log(`server is running on ${PORT}`)
})

