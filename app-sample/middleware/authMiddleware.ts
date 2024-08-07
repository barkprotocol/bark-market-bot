import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Type definition for JWT payload
interface JwtPayload {
    userId: string;
    // Add other fields you expect in the payload
}

/**
 * Middleware to authenticate JWT tokens.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 * @param {NextFunction} next - The next middleware function.
 */
const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        res.status(401).json({ error: 'No authorization header provided' });
        return;
    }

    // Bearer token format: "Bearer <token>"
    const token = authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Token not provided' });
        return;
    }

    // Verify the token using the secret key
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string, (err, decoded: JwtPayload | undefined) => {
        if (err) {
            // Token verification failed
            res.status(403).json({ error: 'Failed to authenticate token' });
            return;
        }

        // Token is valid; attach user info to request object
        if (decoded) {
            req.user = decoded;
        }

        next(); // Proceed to the next middleware or route handler
    });
};

export default authMiddleware;
