import database from '../config/database.js';

import crypto from 'crypto'; 
import fs from 'fs';
import path from 'path';

export const addProduct = async (req, res) => {
    // 1. รับข้อมูลจาก req.body (ชื่อตัวแปรให้ตรงกับที่หน้าบ้านจะส่งมา)
    const { productName, productDescription, productBrand, price, stock } = req.body;

    try {
        // 2. จัดการรูปภาพจาก multer
        const productImage = req.file ? req.file.filename : null;

        if (!productImage) {
            return res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพสินค้า" });
        }

        // 3. สร้าง ID สินค้า
        const productId = `Prd${crypto.randomBytes(4).toString('hex')}`;

        // 4. บันทึกข้อมูล (ตรวจสอบชื่อ Column ใน SQL ให้ตรงกับ Schema ของคุณ)
        // จาก SQL ที่คุณให้มา: productId, productName, productDescription, productImage, productBrand, price, stock
        const queryText = `
            INSERT INTO Products (productId, productName, productDescription, productImage, productBrand, price, stock) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `;

        const newProduct = await database.query(queryText, [
            productId,
            productName,
            productDescription,
            productImage, 
            productBrand,
            price,
            stock || 10 // ตาม Schema ของคุณ DEFAULT คือ 10
        ]);

        res.status(201).json({
            message: "เพิ่มสินค้าสำเร็จ",
            product: newProduct.rows[0],
            imageUrl: `/uploads/${productImage}`
        });

    } catch (error) {
        // หากเกิด Error แต่รูปถูกเซฟไปแล้ว ควรลบรูปทิ้งเพื่อไม่ให้เป็นไฟล์ขยะ
        if (req.file) {
            const filePath = path.join('uploads', req.file.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }
        
        console.error("Add Product Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" });
    }
};

// --- ฟังก์ชันแก้ไขสินค้า (Update Product) ---
export const updateProduct = async (req, res) => {
    const { productid } = req.params;
    const { productName, productDescription, productBrand, price, stock } = req.body;
    
    try {
        // 1. ตรวจสอบสินค้าเดิมก่อนเพื่อเอารูปเก่า
        const checkProduct = await database.query('SELECT * FROM Products WHERE productid = $1', [productid]);
        if (checkProduct.rows.length === 0) {
            // ถ้าไม่พบสินค้า และมีการอัปโหลดรูปมาใหม่ ให้ลบรูปใหม่ทิ้งก่อน return 404
            if (req.file) {
                const newPath = path.join('uploads', req.file.filename);
                if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
            }
            return res.status(404).json({ message: "ไม่พบสินค้าที่ต้องการแก้ไข" });
        }

        const oldProduct = checkProduct.rows[0];
        let productImage = oldProduct.productimage; 

        // 2. จัดการรูปภาพ (ถ้ามีการส่งรูปใหม่มา ให้ลบรูปเก่าทิ้ง)
        if (req.file) {
            productImage = req.file.filename; 

            if (oldProduct.productimage) {
                const oldPath = path.join('uploads', oldProduct.productimage);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath); 
                }
            }
        }

        // 3. อัปเดตข้อมูลทั้งหมด (Full Update - ไม่ใช้ COALESCE เพื่อบังคับส่งค่าใหม่)
        const queryText = `
            UPDATE Products 
            SET productname = $1,
                productdescription = $2,
                productimage = $3,
                productbrand = $4,
                price = $5,
                stock = $6
            WHERE productid = $7
            RETURNING *
        `;

        const result = await database.query(queryText, [
            productName, 
            productDescription, 
            productImage, 
            productBrand, 
            price, 
            stock, 
            productid
        ]);

        res.status(200).json({
            message: "แก้ไขข้อมูลสินค้าสำเร็จ",
            product: result.rows[0],
            imageUrl: `/uploads/${productImage}`
        });

    } catch (error) {
        // หากเกิดข้อผิดพลาดในการ Query ให้ลบรูปที่อัปโหลดมาใหม่ออก (ถ้ามี)
        if (req.file) {
            const newPath = path.join('uploads', req.file.filename);
            if (fs.existsSync(newPath)) fs.unlinkSync(newPath);
        }
        console.error("Update Product Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสินค้า" });
    }
};

export const deleteProduct = async (req, res) => {
    const { productid } = req.params;

    try {

        // 1️⃣ ตรวจสอบว่าถูกใช้งานในตะกร้าหรือคำสั่งซื้อหรือไม่
        const checkUsage = await database.query(
            `
            SELECT 1 FROM CartItems WHERE productid = $1
            UNION
            SELECT 1 FROM OrderItems WHERE productid = $1
            LIMIT 1
            `,
            [productid]
        );

        if (checkUsage.rowCount > 0) {
            return res.status(400).json({
                message: "ไม่สามารถลบสินค้าได้ เนื่องจากมีการใช้งานอยู่ในระบบ"
            });
        }

        // 2️⃣ ลบสินค้า
        const result = await database.query(
            'DELETE FROM Products WHERE productid = $1 RETURNING *',
            [productid]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ 
                message: "ไม่พบสินค้าที่ต้องการลบ" 
            });
        }

        res.status(200).json({ 
            message: "ลบสินค้าเรียบร้อยแล้ว" 
        });

    } catch (error) {
        console.error("Delete Product Error:", error);
        res.status(500).json({ 
            message: "เกิดข้อผิดพลาดในการลบสินค้า" 
        });
    }
};

export const getAllProducts = async (req, res) => {
    try {
        // ดึงข้อมูลทั้งหมดจากตาราง Products เรียงตามชื่อหรือเวลาที่เพิ่มก็ได้
        const queryText = 'SELECT * FROM Products ORDER BY productname ASC';
        const result = await database.query(queryText);

        res.status(200).json({
            message: "ดึงข้อมูลสินค้าสำเร็จ",
            count: result.rowCount,
            products: result.rows
        });
    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
    }
};

export const getProductById = async (req, res) => {
    const { productid } = req.params;

    try {
        const queryText = 'SELECT * FROM Products WHERE productid = $1';
        const result = await database.query(queryText, [productid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้าที่ระบุ" });
        }

        res.status(200).json({
            message: "ดึงข้อมูลสินค้าสำเร็จ",
            product: result.rows[0]
        });
    } catch (error) {
        console.error("Get Product By ID Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
    }
};

export const getProductWithFilter = async (req, res) => {
    // ดึง object filter ออกมาจาก req.body
    const { filter } = req.body; 

    try {
        // 1. สร้างโครง Query เริ่มต้น
        let query = 'SELECT * FROM Products WHERE 1=1';
        
        const values = [];
        let valueIndex = 1;

        // 2. ตรวจสอบว่ามีการส่ง filter มาหรือไม่
        if (filter) {
            
            // 💡 แก้ไข: เปลี่ยนจาก = เป็น ILIKE เพื่อค้นหาแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่ 
            // ตัวอย่าง: ถ้าผู้ใช้ส่ง "adidas" ระบบจะเจอทั้ง "Adidas", "ADIDAS", "adidas"
            if (filter.brand) {
                query +=  `AND productBrand ILIKE $${valueIndex}`;
                values.push(filter.brand); 
                valueIndex++;
            }

            // ถ้ามีระบุ name ให้กรองตาม productName 
            if (filter.name) {
                query +=  `AND productName ILIKE $${valueIndex}`;
                values.push(`%${filter.name}%`); 
                valueIndex++;
            }

            // ถ้ามีระบุ price ให้กรองตาม price
            if (filter.price) {
                query +=  `AND price <= $${valueIndex}`; 
                values.push(filter.price);
                valueIndex++;
            }
        }

        // 3. สั่งรัน Query
        const result = await pool.query(query, values);

        // 4. ส่งผลลัพธ์กลับไป
        res.status(200).json({
            message: "ค้นหาสินค้าสำเร็จ",
            total_found: result.rows.length,
            products: result.rows
        });

    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
    }
};