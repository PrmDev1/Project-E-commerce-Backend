import database from '../config/database.js';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken'; 

export const register = async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const userCheck = await database.query(
            'SELECT * FROM Users WHERE email = $1', 
            [email]
        );

        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "Email นี้ถูกใช้งานแล้ว" });
        }

        const randomId = crypto.randomBytes(4).toString('hex'); 
        const userid = `Usr${randomId}${Date.now().toString().slice(-4)}`; // 👈 แก้ไขเพิ่ม Backtick ให้แล้วครับ

        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const newUser = await database.query(
            'INSERT INTO Users (userid, username, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userid, username, email, hashedPassword, role]
        );

        const user = newUser.rows[0];

        // 5. 🎯 สร้าง JWT Token
        const token = jwt.sign(
            { id: user.userid, name: user.username, username: user.username, role: user.role, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' } // หมดอายุใน 1 วัน
        );

        // 6. 🍪 ส่ง Token กลับไปใน Cookie
        res.cookie('token', token, {
            httpOnly: true, 
            secure: process.env.NODE_ENV === 'production', 
            sameSite: 'strict', 
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(201).json({
            message: "ลงทะเบียนและเข้าสู่ระบบสำเร็จ",
            user: {
                id: user.userid,
                name: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Register Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. ตรวจสอบว่ามี Email นี้ในระบบหรือไม่
        const result = await database.query(
            'SELECT * FROM Users WHERE email = $1',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานด้วย Email นี้" });
        }

        const user = result.rows[0];

        // 2. ตรวจสอบรหัสผ่าน
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "รหัสผ่านไม่ถูกต้อง" });
        }

        // 3. 🎯 สร้าง JWT Token เมื่อรหัสผ่านถูกต้อง
        const token = jwt.sign(
            { id: user.userid, name: user.username, role: user.role, email: user.email }, 
            process.env.JWT_SECRET, 
            { expiresIn: '1d' }
        );

        // 4. 🍪 ส่ง Token กลับไปใน Cookie
        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({
            message: "เข้าสู่ระบบสำเร็จ",
            user: {
                id: user.userid,
                name: user.username,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }
};

export const addAddress = async (req, res) => {
    // 1. รับข้อมูลที่อยู่จากหน้าบ้าน
    const { province, district, locality, postCode, name, number, note } = req.body;
    
    const userId = req.user.id; 

    try {
        // 3. สร้าง addressId แบบสุ่ม (Prefix 'Ad' ตามตัวอย่างข้อมูลที่คุณให้มา)
        const addressId = `Ad${crypto.randomBytes(6).toString('hex')}`;

        // 4. บันทึกลงตาราง Addresses
        const queryText = `
            INSERT INTO Addresses (addressId, userId, province, district, locality, postCode, name, number, note)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *
        `;

        const newAddress = await database.query(queryText, [
            addressId,
            userId,
            province,
            district,
            locality,
            postCode,
            name,
            number,
            note
        ]);

        res.status(201).json({
            message: "เพิ่มที่อยู่สำเร็จ",
            address: newAddress.rows[0]
        });

    } catch (error) {
        console.error("Add Address Error:", error);
        res.status(500).json({ message: "ไม่สามารถเพิ่มที่อยู่ได้" });
    }
};

export const getMyAddresses = async (req, res) => {
    const userId = req.user.id;

    try {
        const queryText = `
            SELECT addressId, userId, province, district, locality, postCode, name, number, note
            FROM Addresses
            WHERE userId = $1
            ORDER BY addressId DESC
        `;

        const result = await database.query(queryText, [userId]);

        res.status(200).json({
            message: "ดึงข้อมูลที่อยู่สำเร็จ",
            addresses: result.rows
        });
    } catch (error) {
        console.error("Get My Addresses Error:", error);
        res.status(500).json({ message: "ไม่สามารถดึงข้อมูลที่อยู่ได้" });
    }
};

export const getAllUsers = async (req, res) => {
    try {
        // 1. สร้างคำสั่ง SQL ดึงเฉพาะคอลัมน์ที่ต้องการ (ไม่ดึง password ออกมาเด็ดขาด)
        const query = 'SELECT userid, username, email, role FROM Users';

        // 2. สั่งรัน Query
        const result = await database.query(query);

        // 3. ส่งข้อมูลกลับไปในรูปแบบ JSON
        res.status(200).json({
            message: "ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ",
            total_users: result.rows.length, // บอกจำนวนผู้ใช้ทั้งหมดด้วย
            users: result.rows
        });

    } catch (error) {
        console.error("Get All Users Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ออกจากระบบ" });
    }
};

// users/edit-profile
// function สำหรับแก้ไขข้อมูลผู้ใช้ (เฉพาะ admin เท่านั้นที่เข้าถึงได้)
export const editUserProfile = async (req, res) => {
    // รับค่าที่ Frontend ส่งมาจากการกดแก้ไขในตาราง
    const { userid, username, email, role } = req.body;

    // 1. ตรวจสอบว่ามี userid ส่งมาด้วยหรือไม่ (สำคัญมาก ป้องกันการเผลออัปเดตมั่ว)
    if (!userid) {
        return res.status(400).json({ message: "กรุณาระบุ User ID ที่ต้องการแก้ไข" });
    }

    try {
        // 2. สร้างคำสั่ง SQL สำหรับอัปเดตข้อมูล
        const query = `
            UPDATE Users 
            SET username = $1, email = $2, role = $3
            WHERE userid = $4
            RETURNING userid, username, email, role; -- ดึงข้อมูลที่เพิ่งแก้เสร็จกลับมาด้วย
        `;

        // 3. รันคำสั่ง SQL พร้อมใส่ค่า (เรียงลำดับให้ตรงกับ $1, $2, $3, $4)
        const result = await database.query(query, [username, email, role, userid]);

        // 4. ตรวจสอบว่าเจอ user คนนี้และได้อัปเดตจริงๆ ไหม
        if (result.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบผู้ใช้งานนี้ในระบบ" });
        }

        // 5. ส่งผลลัพธ์การอัปเดตกลับไปให้ Frontend
        res.status(200).json({
            message: "อัปเดตข้อมูลผู้ใช้สำเร็จ",
            user: result.rows[0] // ส่งข้อมูลก้อนใหม่กลับไปให้ Frontend อัปเดตตาราง
        });

    } catch (error) {
        console.error("Edit User Profile Error:", error);
        
        // 💡 ดักจับ Error กรณีที่แอดมินเผลอเปลี่ยน Email ไปซ้ำกับคนอื่นที่มีในระบบ
        // (ใน PostgreSQL รหัส 23505 คือ Unique Violation)
        if (error.code === '23505') { 
            return res.status(400).json({ message: "Email นี้มีคนใช้งานในระบบแล้ว กรุณาใช้ Email อื่น" });
        }

        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้" });
    }
};


/* ข้อมูลที่จะได้จาก path นี้
{
  "message": "ดึงข้อมูลผู้ใช้และประวัติการสั่งซื้อทั้งหมดสำเร็จ",
  "total_users": 2,
  "users": [
    {
      "userid": "Usd1111",
      "username": "pongpak",
      "email": "pongpak@example.com",
      "order_history": [
        {
          "orderid": "ORD-001",
          "totalamount": 4500,
          "datetime": "2026-03-01...",
          "items": [
             { "productname": "Adidas Supernova", "price": 4500 }
          ]
        }
      ]
    },
    {
      "userid": "Usd2222",
      "username": "new_customer",
      "email": "new@example.com",
      "order_history": [] 
      // 🌟 จะแสดง Array ว่างสำหรับคนที่ยังไม่เคยซื้ออะไรเลย
    }
  ]
}
*/
export const getAllOrderHistory = async (req, res) => {
    try {
        // ใช้ CTE (WITH) เพื่อจัดกลุ่มข้อมูลซ้อนกัน 2 ชั้น ให้เป็นระเบียบและทำงานไว
        const query = `
            WITH OrderDetails AS (
                -- ชั้นที่ 1: มัดรวมสินค้า (OrderItems) เข้าด้วยกันตาม orderid
                SELECT 
                    oi.orderid,
                    json_agg(
                        json_build_object(
                            'itemid', oi.itemid,
                            'productid', oi.productid,
                            'productname', p.productname,
                            'quantity', oi.quantity,
                            'size', oi.size,
                            'price', oi.price
                        )
                    ) AS items
                FROM OrderItems oi
                LEFT JOIN Products p ON oi.productid = p.productid
                GROUP BY oi.orderid
            ),
            UserOrders AS (
                -- ชั้นที่ 2: มัดรวมบิล (Orders) เข้าด้วยกันตาม userid
                SELECT 
                    o.userid,
                    json_agg(
                        json_build_object(
                            'orderid', o.orderid,
                            'addressid', o.addressid,
                            'totalamount', o.totalamount,
                            'status', o.status,
                            'datetime', o.datetime,
                            'items', COALESCE(od.items, '[]'::json) -- ถ้าบิลนี้ไม่มีสินค้า ให้ใช้ Array ว่างป้องกันค่า null
                        ) ORDER BY o.datetime DESC
                    ) AS orders
                FROM Orders o
                LEFT JOIN OrderDetails od ON o.orderid = od.orderid
                GROUP BY o.userid
            )
            -- ชั้นที่ 3: ดึงตาราง Users ทุกคนเป็นหลัก แล้วเอาประวัติการซื้อ (UserOrders) มาต่อท้าย
            SELECT 
                u.userid, 
                u.username, 
                u.email,
                -- COALESCE จะช่วยแปลงค่า null (สำหรับคนที่ยังไม่เคยซื้อ) ให้กลายเป็น Array ว่าง []
                COALESCE(uo.orders, '[]'::json) AS order_history 
            FROM Users u
            LEFT JOIN UserOrders uo ON u.userid = uo.userid
            ORDER BY u.userid ASC; -- เรียงตามรหัสผู้ใช้ หรือเปลี่ยนเป็น u.username ก็ได้
        `;

        const result = await database.query(query);

        res.status(200).json({
            message: "ดึงข้อมูลผู้ใช้และประวัติการสั่งซื้อทั้งหมดสำเร็จ",
            total_users: result.rows.length,
            users: result.rows
        });

    } catch (error) {
        console.error("Get All Users Order History Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการสั่งซื้อ" });
    }
};

export const getMyPaidOrderHistory = async (req, res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
    }

    try {
        const query = `
            WITH OrderDetails AS (
                SELECT 
                    oi.orderid,
                    json_agg(
                        json_build_object(
                            'itemid', oi.itemid,
                            'productid', oi.productid,
                            'productname', p.productname,
                            'productimage', p.productimage,
                            'quantity', oi.quantity,
                            'size', oi.size,
                            'price', oi.price
                        )
                    ) AS items
                FROM OrderItems oi
                LEFT JOIN Products p ON oi.productid = p.productid
                GROUP BY oi.orderid
            )
            SELECT 
                o.orderid,
                o.totalamount,
                o.status,
                o.datetime,
                COALESCE(od.items, '[]'::json) AS items
            FROM Orders o
            LEFT JOIN OrderDetails od ON o.orderid = od.orderid
                        WHERE o.userid = $1
            ORDER BY o.datetime DESC;
        `;

        const result = await database.query(query, [userId]);

        res.status(200).json({
            message: "ดึงประวัติการสั่งซื้อสำเร็จ",
            total_orders: result.rows.length,
            orders: result.rows,
        });
    } catch (error) {
        console.error("Get My Paid Order History Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการสั่งซื้อ" });
    }
};