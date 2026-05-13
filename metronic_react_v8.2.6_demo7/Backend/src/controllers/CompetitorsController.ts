import { type Request, type Response } from "express"
import { Competitors } from "../models/Competior.js"
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const getCompetitors = async (req: Request, res: Response) => {
    try {
        const users = await Competitors.find();
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching Competitors", error: error.message });
    }
}