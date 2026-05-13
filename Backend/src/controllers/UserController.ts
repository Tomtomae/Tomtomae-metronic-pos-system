import { type Request, type Response } from 'express';
import { ROLES, User } from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// เพิ่ม user เข้าไปใน Interface เพื่อให้รับค่าจาก Middleware ได้
interface RequestWithFile extends Request {
    file?: Express.Multer.File;
    user?: { id: string; role: string }; 
}

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ success: false, message: "Error fetching users", error: message });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { first_name, last_name, email, password, role } = req.body || {};

        if (!first_name || !last_name || !email || !password) {
            return res.status(400).json({ success: false, message: "ຂໍ້ມູນບໍ່ຄົບຖ້ວນ" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: "ອີເມວນີ້ມີໃນລະບົບແລ້ວ" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            first_name,
            last_name,
            email,
            password: hashedPassword,
            username: email.split('@')[0],
            pic: 'media/avatars/blank.png',
            role: role === ROLES.ADMIN ? ROLES.ADMIN : ROLES.EMPLOYEE,
        });

        const savedUser = await newUser.save();
        const token = jwt.sign(
            { id: savedUser._id, role: savedUser.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.status(201).json({
            success: true,
            api_token: token,
            user: savedUser
        });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(400).json({ success: false, message: "Error creating user", error: message });
    }
};

export const loginUser = async (req: Request, res: Response): Promise<Response> => {
    try {
        const { email, password } = req.body as Record<string, string | undefined>;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານ"
            });
        }

        const cleanEmail = email.trim();

        const user = await User.findOne({
            email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') }
        });

        if (!user) {
            console.log("Login Fail: User not found ->", cleanEmail);
            return res.status(401).json({
                success: false,
                message: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password || "");
        if (!isMatch) {
            console.log("Login Fail: Password mismatch for ->", cleanEmail);
            return res.status(401).json({
                success: false,
                message: "ອີເມວ ຫຼື ລະຫັດຜ່ານບໍ່ຖືກຕ້ອງ"
            });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        const userData = user.toJSON();
        delete userData.password;

        console.log("Login Success:", cleanEmail, `[Role: ${user.role}]`);

        return res.status(200).json({
            success: true,
            api_token: token,
            user: userData
        });

    } catch (error: unknown) {
        console.error("Login Error:", error);
        return res.status(500).json({
            success: false,
            message: "ເກີດຂໍ້ຜິດພາດໃນລະບົບ"
        });
    }
};

export const verifyToken = async (req: Request, res: Response) => {
    try {
        const { api_token } = req.body;
        if (!api_token) return res.status(401).json({ success: false, message: "No token provided" });

        const decoded = jwt.verify(api_token, process.env.JWT_SECRET || 'secret') as { id: string };
        const user = await User.findById(decoded.id).select('-password');

        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        res.status(200).json(user);
    } catch (error: unknown) {
        res.status(401).json({ success: false, message: "Token expired or invalid" });
    }
};

export const updateProfile = async (req: RequestWithFile, res: Response) => {
    try {
        const { userId, id, ...rest } = req.body;
        const targetId = userId || id || req.params.id;

        if (!targetId) {
            return res.status(400).json({ success: false, message: "User ID is required" });
        }

        // 🛡️ [SECURITY] ປ້ອງກັນ Employee ບໍ່ໃຫ້ແກ້ໄຂຂໍ້ມູນຂອງຄົນອື່ນ
        if (req.user?.role === ROLES.EMPLOYEE && req.user?.id !== targetId) {
            return res.status(403).json({ 
                success: false, 
                message: "ທ່ານບໍ່ມີສິດແກ້ໄຂຂໍ້ມູນຂອງຜູ້ໃຊ້ອື່ນ (Access Denied)" 
            });
        }

        const updateData: Record<string, unknown> = {};
        const forbiddenFields = ['password', 'email', 'username', 'role', 'roles', '_id', '__v'];

        Object.keys(rest).forEach((key) => {
            if (!forbiddenFields.includes(key) &&
                typeof rest[key] !== 'object' &&
                rest[key] !== undefined) {
                updateData[key] = rest[key];
            }
        });

        if (req.file) {
            const filePath = req.file.path.replace(/\\/g, "/");
            updateData.pic = filePath.replace("public/", "");
        }

        const safeNestedUpdate = (fieldName: string) => {
            if (rest[fieldName]) {
                try {
                    const data = typeof rest[fieldName] === 'string'
                        ? JSON.parse(rest[fieldName])
                        : rest[fieldName];

                    if (data && typeof data === 'object') {
                        Object.keys(data).forEach((subKey) => {
                            updateData[`${fieldName}.${subKey}`] = data[subKey];
                        });
                    }
                } catch (e) {
                    console.error(`Skipping ${fieldName} update: Invalid format received.`);
                }
            }
        };

        safeNestedUpdate('address');
        safeNestedUpdate('socialNetworks');
        safeNestedUpdate('settings');

        const updatedUser = await User.findByIdAndUpdate(
            targetId,
            { $set: updateData },
            { new: true, runValidators: false  }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json(updatedUser);

    } catch (error: unknown) {
        console.error("Update Error:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error during profile update"
        });
    }
};

export const updateRole = async (req: Request, res: Response) => {
    try {
        const { userId, role } = req.body;

        if (!userId || !role) {
            return res.status(400).json({ success: false, message: "ກະລຸນາສົ່ງ userId ແລະ role" });
        }

        if (!Object.values(ROLES).includes(role)) {
            return res.status(400).json({
                success: false,
                message: `Role ບໍ່ຖືກຕ້ອງ, ຕ້ອງເປັນ: ${Object.values(ROLES).join(' ຫຼື ')}`
            });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { $set: { role } },
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "ບໍ່ພົບ User" });
        }

        res.status(200).json({ success: true, user: updatedUser });

    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error occurred";
        res.status(500).json({ success: false, message: "Error updating role", error: message });
    }
};

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ success: false, message: "ກະລຸນາປ້ອນອີເມວ ແລະ ລະຫັດຜ່ານໃໝ່" });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ success: false, message: "ບໍ່ພົບອີເມວນີ້ໃນລະບົບ" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        res.status(200).json({ success: true, message: "ປ່ຽນລະຫັດຜ່ານສຳເລັດແລ້ວ" });
    } catch (error: unknown) {
        res.status(500).json({ success: false, message: "ເກີດຂໍ້ຜິດພາດໃນການ Reset ລະຫັດຜ່ານ" });
    }
};