import multer from 'multer';
import path from 'path';
import fs from 'fs';


const uploadDir = 'uploads/avatars/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `avatar-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

export const upload = multer({ 
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 } // ຈຳກັດ 2MB
});