import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { User } from '../../app-sample/models/user'; // Adjust the import based on your project structure

// Type definition for JWT payload
interface JwtPayload {
    userId: string;
    // Add other fields you expect in the payload
}

/**
 * Handles user login and returns a JWT token if credentials are valid.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
export const login = async (req: Request, res: Response): Promise<void> => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400).json({ error: 'Username and password are required' });
        return;
    }

    try {
        // Find user by username
        const user = await User.findOne({ username });
        if (!user) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }

        // Check if password matches
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid username or password' });
            return;
        }

        // Create JWT token
        const payload: JwtPayload = { userId: user._id };
        const token = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET as string, { expiresIn: '1h' });

        res.json({ token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Middleware to verify the JWT token and attach user info to request.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token not provided' });
        return;
    }

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, decoded: JwtPayload | undefined) => {
        if (err) {
            res.status(403).json({ error: 'Failed to authenticate token' });
            return;
        }

        if (decoded) {
            req.user = decoded;
        }

        next();
    });
};
