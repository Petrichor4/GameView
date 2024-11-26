import { Router, type Request, type Response } from 'express';
import { User } from '../models/user.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
// import { Pool } from 'pg';

// const pool = new Pool({
//   connectionString: process.env.DATABASE_URL,
// });

const router = Router();

// This function is triggered during login or registration
const generateToken = (username: string) => {
  const secretKey = process.env.JWT_SECRET_KEY || '';  // Get the secret key from .env
  return jwt.sign({ username }, secretKey, { expiresIn: '1h' });  // Create JWT with an expiration time
  console.log("Token generated: ", generateToken);
};

// Check if username is available
router.post('/check-username', async (req: Request, res: Response) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    // Check if the username exists in the database
    const existingUser = await User.findOne({
      where: { username },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username is already taken' });
    }
    console.log('Username is available' + username);

    // Username is available
    return res.status(200).json({ message: 'Username is available' });

  } catch (error) {
    console.error('Error checking username:', error);
    return res.status(500).json({ message: 'Failed to check username availability' });
  }
});

const register = async (req: Request, res: Response) => {
  const { username, password, confirmPassword, email } = req.body;
  const existingUser = await User.findOne({
    where: { username },
  });

  if (existingUser) {
    return res.status(400).json({ message: 'Username is already taken' });
  }
  
  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  const hashedPassword = await bcrypt.hash(password, 10); // Hashing with 10 rounds
 
  try {
    const newUser = await User.create({ username, password: hashedPassword, email });
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const token = jwt.sign({ username: newUser.username }, secretKey, { expiresIn: '1h' });
  
    return res.status(201).json({ token });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ message: 'Failed to register user' });
  }
};


export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  const user = await User.findOne({
    where: { username },
  });
  if (!user) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  const passwordIsValid = await bcrypt.compare(password, user.password);
  if (!passwordIsValid) {
    return res.status(401).json({ message: 'Authentication failed' });
  }

  const token = generateToken(user.username);  // Generate the JWT for the user
  return res.json({ token });  // Send the token back to the client
};



// POST /login - Login a user
router.post('/login', login);

// POST /register - Register a new user
router.post('/register', register);

 


export default router;
