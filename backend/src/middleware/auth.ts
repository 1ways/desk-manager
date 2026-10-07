import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({ message: "No access. Token missing" })
            return
        }

        const token = authHeader.split(" ")[1]

        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string, role: string }

        req.user = decoded

        next()
    } catch (error) {
        res.status(403).json({ message: "Invalid or expired token" })
    }
}

export const authorizeAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user && req.user.role === "admin") {
        next()
    } else {
        res.status(403).json({message: "Access is denied. Administrator privileges are required"})
    }
}