import { type Request, type Response } from 'express';
import { User } from '../models/User.js';
import bcrypt from 'bcryptjs'; // npm install bcryptjs @types/bcryptjs
import jwt from 'jsonwebtoken'; // npm install jsonwebtoken @types/jsonwebtoken

// 1. ดึงข้อมูล User ทั้งหมด
export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error: any) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

// 2. สมัครสมาชิก (Register) - ปรับฟิลด์ให้ตรงกับ UserModel
export const createUser = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, email, password } = req.body || {};

        if (!first_name ||!email || !password) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน (first_name, email, password จำเป็น)" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            username: email.split('@')[0], // สร้าง username ชั่วคราวจาก email
        });

        const savedUser = await newUser.save();
        
        // สร้าง Token
        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

    
        res.status(201).json({
            api_token: token,
            user: savedUser
        });

    } catch (error: any) {
        res.status(400).json({ message: "Error creating user", error: error.message });
    }
};

// 3. เข้าสู่ระบบ (Login)
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !(await bcrypt.compare(password, user.password as string))) {
            return res.status(401).json({ message: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });

        res.status(200).json({ 
            api_token: token,
            user: user
        });
    } catch (error: any) {
        res.status(500).json({ message: "Login Error", error: error.message });
    }
};

// 4. ตรวจสอบ Token (Verify Token) - ใช้ใน Metronic ตอนโหลดหน้าเว็บใหม่
export const verifyToken = async (req: Request, res: Response) => {
    try {
        const { api_token } = req.body;
        if (!api_token) return res.status(401).send("No token");

        const decoded: any = jwt.verify(api_token, process.env.JWT_SECRET || 'secret');
        const user = await User.findById(decoded.id).select('-password');
        
        if (!user) return res.status(404).send("User not found");
        
        res.status(200).json(user);
    } catch (error) {
        res.status(401).send("  ");
    }
};

export const updateProfile = async (req: Request, res: Response) => {
    try {
        const { userId, id, ...rest } = req.body;
        const targetId = userId || id || req.params.id;
        if (!targetId) {
            return res.status(400).json({ message: "User ID is required" });
        }
        delete rest.password;
        delete rest.email;
        delete rest.api_token;
        if (rest.language && !['en', 'de', 'es', 'fr', 'ja', 'zh', 'ru'].includes(rest.language)) {
            delete rest.language; // ถ้าส่งภาษาที่ Schema ไม่รองรับมา ให้ลบออก ไม่ให้พัง
        }
        const updatedUser = await User.findByIdAndUpdate(
            targetId,
            { $set: rest }, // $set จะอัปเดตเฉพาะฟิลด์ที่ส่งมา
            { 
                new: true,           // คืนค่าข้อมูลใหม่หลังอัปเดต
                runValidators: true  // ตรวจสอบความถูกต้องตาม Schema อีกรอบ
            }
        ).select('-password'); // ไม่ส่ง password กลับไปหน้าบ้าน

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(updatedUser);
    } catch (error: any) {
        console.error("Critical Update Error:", error);
        res.status(500).json({ 
            message: "Error updating profile", 
            error: error.message 
        });
    }
};