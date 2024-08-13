
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const axios = require('axios');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
require('dotenv').config();
// CORS middleware
app.use(express.json());
app.use(cors());


// MongoDB Atlas connection string (replace with your connection string)
const mongoURI = process.env.MONGO_URI;

// Connect to MongoDB Atlas
mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB Atlas');
});

// Define a schema for the User model
const userSchema = new mongoose.Schema({
  fname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});

const User = mongoose.model('User', userSchema);


//schema for finmo variable
const integrationVariablesSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
  },
  apiKey: {
    type: String,
    required: true,
    trim: true,
  },
  brokerageId: {
    type: String,
    required: true,
    trim: true,
  },
});

const IntegrationVariables = mongoose.model('IntegrationVariables', integrationVariablesSchema);



// API endpoints

// Create a new user
app.post('/api/users', async (req, res) => {
  const { fname, email, password } = req.body;

  // Validate input
  if (!fname || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400);
    }

    // Create new user instance
    const newUser = new User({
      fname,
      email,
      password
    });

    // Save user to database
    const savedUser = await newUser.save();

    // Return success response
    res.status(201).json({ message: 'User created successfully', user: savedUser });
  } catch (error) {
    console.error('Error saving user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    // Find user by username (email in this case)
    const user = await User.findOne({ email: username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Validate password (You should use bcrypt or similar for password hashing)
    if (user.password !== password) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Return user details (excluding sensitive information like password)
    res.status(200).json({
      _id: user._id,
      fname: user.fname,
      email: user.email,
      // Add other necessary user details here
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



//finmo Variables:
app.post('/save', async (req, res) => {
  try {
    const { email, apiKey, brokerageId } = req.body;
    // Check if the data is provided
    if (!email || !apiKey || !brokerageId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    // Create a new document
    const newIntegration = new IntegrationVariables({ email, apiKey, brokerageId });
    // Save to the database
    await newIntegration.save();
    res.status(201).json({ message: 'Data saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// GET endpoint to fetch user data by email
app.get('/data/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const data = await IntegrationVariables.findOne({ email });

    if (!data) {
      return res.status(404).json({ error: 'No data found for this user' });
    }

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});




// Nylas OAuth2 credentials
const CLIENT_ID = process.env.NYLAS_CLIENT_ID;
const CLIENT_SECRET = process.env.NYLAS_SECRET;
const REDIRECT_URI = `${process.env.BASE_CLIENT_URL}/apps/email`;

// Route for initiating OAuth2 authentication
app.get('/email-auth', (req, res) => {
  // Redirect the user to Nylas authorization URL
  const authUrl = `https://api.us.nylas.com/v3/connect/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code`;
  // res.redirect(authUrl);
  // Send the authentication URL back to the frontend
  res.json({ authUrl });
});


app.get('/callback', async (req, res) => {
  const code = req.query.code;
  // Ensure code is present and valid
  if (!code) {
    return res.status(400).send('Authorization code not found.');
  }
  try {
    // Perform your backend logic with the code here
    // Example: Exchange code for access token with Nylas API
    const tokenResponse = await axios.post('https://api.us.nylas.com/v3/connect/token', {
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: `${process.env.BASE_CLIENT_URL}/apps/email`
    });
    // Example: Fetch user's email messages using grant_id
    const accessToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;
    const grantId = tokenResponse.data.grant_id;
    const emailsResponse = await axios.get(`https://api.us.nylas.com/v3/grants/${grantId}/messages?limit=20`, {
      headers: {
        'Authorization': `Bearer ${CLIENT_SECRET}`
      }
    });
    // Example response handling
    res.json(emailsResponse.data);
  } catch (error) {
    console.error('Error exchanging code for access token:', error);
    res.status(500).send('Failed to exchange code for access token.');
  }
});

//finmo function
app.get('/finmo', async (req, res) => {
  try {
    // Set up headers for the request
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.FINMO_TOKEN}`
    };

    // Make GET request to Finmo API
    const response = await axios.get(`https://app.finmo.ca/api/v1/applications?brokerageId=${process.env.FINMO_BROKERAGE_ID}`, {
      headers: headers
    });
    // Respond with the data received from Finmo API
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Finmo API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/finmo-client', async (req, res) => {
  try {
    // Set up headers for the request
    const headers = {
      'Accept': 'application/json',
      'Authorization': `Bearer ${process.env.FINMO_TOKEN}`
    };

    // Make GET request to Finmo API
    const response = await axios.get(`https://app.finmo.ca/api/v1/applications?brokerageId=${process.env.FINMO_BROKERAGE_ID}`, {
      headers: headers
    });
    // Respond with the data received from Finmo API
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching data from Finmo API:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
