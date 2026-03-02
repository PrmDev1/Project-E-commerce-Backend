// middleware/verifyToken.js
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    // 1. ดึง Token ออกมาจาก Cookie
    const token = req.cookies.token;

    // 2. ถ้าไม่มี Token แปลว่ายังไม่ได้ Login
    if (!token) {
        return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    try {
        // 3. ตรวจสอบว่า Token ถูกต้องและยังไม่หมดอายุใช่ไหม
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. ถ้าถูกต้อง ให้เอาข้อมูล User (เช่น id, name) ไปแปะไว้ที่ req.user
        // เพื่อให้ Controller ตัวถัดไปสามารถดึงไปใช้ได้เลย
        req.user = decoded;
        
        // 5. สั่งให้เดินทางไปที่ฟังก์ชันถัดไป (เช่น ไปที่ Controller)
        next();
    } catch (error) {
        console.error("Token verification error:", error);
        return res.status(403).json({ message: "Token ไม่ถูกต้อง หรือหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่" });
    }
};

export const verifyRole = (roles) => {
    return (req, res, next) => {
        // ต้องมั่นใจว่า verifyToken ทำงานไปแล้ว และมีข้อมูล req.user
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: "ไม่พบข้อมูลสิทธิ์การใช้งาน (Role) ของคุณ" });
        }

        // เช็คว่า Role ของผู้ใช้คนนี้ อยู่ในกลุ่มที่ได้รับอนุญาตหรือไม่
        if (roles.includes(req.user.role)) {
            next(); // มีสิทธิ์! ให้ผ่านไปทำงาน Controller ถัดไปได้
        } else {
            return res.status(403).json({ message: "ถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้" });
        }
    };
};
