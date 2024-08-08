const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Groq = require('groq-sdk');
const path = require('path');

const app = express();
const secretKey = 'HTVTgreenprem';

app.use(cors({
    origin: '*', // Allow all origins (you can specify specific origins if needed)
    methods: ['GET', 'POST'], // Allow specific methods
    preflightContinue: false, // Do not pass the preflight response to the next handler
    optionsSuccessStatus: 204 // Status code for successful OPTIONS requests
  }));

app.use(bodyParser.json());
app.use(cors()); // Enable CORS for all routes

mongoose.connect('mongodb+srv://tofunmiareoye:SPWRWDCWopNFHf10@htvt.4rkda.mongodb.net/?retryWrites=true&w=majority&appName=HTVT', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Define the token schema and model
const tokenSchema = new mongoose.Schema({
    id: String,
    token: String
});

const Token = mongoose.model('Token', tokenSchema);

function findDecimalNumber(text) {
    // Regular expression to match a number with up to two decimal places
    const regex = /(\d+\.\d{1,2})/;
    
    // Find the match
    const match = text.match(regex);
    
    // Return the matched number if found, otherwise return null
    return match ? match[0] : null;
}


const boldMap = {
    'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝',
    'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡',
    'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥',
    'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩',
    'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭',
    'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱',
    'y': '𝐲', 'z': '𝐳',
    'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃',
    'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇',
    'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋',
    'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏',
    'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓',
    'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗',
    'Y': '𝐘', 'Z': '𝐙'
};

const reverseBoldMap = {};
for (const [key, value] of Object.entries(boldMap)) {
    reverseBoldMap[value] = key;
}

function convertBoldToNormal(input) {
    if (typeof input !== 'string') {
        throw new TypeError('Input must be a string');
    }

    let result = '';
    for (const char of input) {
        result += reverseBoldMap[char] || char;
    }
    return result;
}

app.use(express.static(path.join(__dirname, 'public')));

// Define a route to handle the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/token', async (req, res) => {
    const { id, question, timestamp, senderMail } = req.body;



    try {

        const resp = await getChatCompletion(question)

        console.log(id)
    
        const score = findDecimalNumber(resp)
    
        console.log(score)
        // Create JWT token
        const token = jwt.sign({ id, score, timestamp, senderMail }, secretKey);

        //console.log(token)

        // Create a new token document
        const tokenDoc = new Token({ id, token });

        // console.log(tokenDoc)

        // Save the token document to MongoDB
        await tokenDoc.save();

        res.status(201).send({ id, score });
    } catch (error) {
        res.status(500).send('Error creating token');
    }
});

// Route to handle GET request
app.get('/api/token/:Id', async (req, res) => {
    const { Id } = req.params;

    console.log(Id);
    console.log(typeof(Id))

    id = convertBoldToNormal(Id).split('HTVT')
    if (id.length > 1){id = id[1]}
    else {id = id[0]}
    console.log(id)

    try {
        // Find the token document by id
        const tokenDoc = await Token.findOne({ id });

        if (!tokenDoc) {
            return res.status(404).send('Token not found');
        }

        // Verify and decode the JWT token
        const decoded = jwt.verify(tokenDoc.token, secretKey);

        // Return the extracted values
        res.status(200).json({
            id: decoded.id,
            score: decoded.score,
            timestamp: decoded.timestamp,
            senderMail: decoded.senderMail
        });
    } catch (error) {
        res.status(500).send('Error retrieving token');
    }
});


const groq = new Groq({ apiKey: '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' });

async function getChatCompletion(question) {
    if (!question) {
        throw new Error('No question provided');
    }

    try {
        const chatCompletion = await groq.chat.completions.create({
            model: "gemma2-9b-it",
            messages: [
                {
                    role: 'system',
                    content: 'response on json only'
                },
                {
                    role: 'user',
                    content: question + " tell me if user has written by his own, or copy pasted from ai, give me a score for written by human in range (0.0, 1.0) response in this json format {'score' : your predicted score}"
                }
            ],
            temperature: 1,
            max_tokens: 1024,
            top_p: 1,
            stream: false,
            stop: null,
        });
        console.log(question)
        const responseText = chatCompletion.choices[0].message;

        return responseText.content;
    } catch (error) {
        console.error('Error:', error);
        throw new Error('An error occurred');
    }
}



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
