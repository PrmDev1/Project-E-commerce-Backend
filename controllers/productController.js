import database from '../config/database.js';

import crypto from 'crypto'; 

import crypto from 'crypto';

export const addProduct = async (req, res) => {
    // 1. รับข้อมูลจาก req.body
    const { productName, productDescription, productbrand, price, stock } = req.body;

    try {
        // 2. ตรวจสอบว่ามีไฟล์ส่งมาไหม
        // ถ้าไม่มีไฟล์ส่งมาให้ใช้ค่า null หรือจะ return error ก็ได้ครับ
        const productImage = req.file ? req.file.filename : null;

        if (!productImage) {
            return res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพสินค้า" });
        }

        const productId = `Prd${crypto.randomBytes(4).toString('hex')}`;

        // ตรวจสอบ productId ซ้ำ (เหมือนเดิม)
        const checkProduct = await database.query(
            'SELECT * FROM Products WHERE productid = $1',
            [productId]
        );

        if (checkProduct.rows.length > 0) {
            return res.status(400).json({ message: "รหัสสินค้านี้มีอยู่ในระบบแล้ว" });
        }

        // 3. บันทึกข้อมูล (ใช้ชื่อไฟล์จาก multer ที่เก็บใน productImage)
        const queryText = `
            INSERT INTO Products (productid, productname, productdescription, productimage, productbrand, price, stock) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *
        `;

        const newProduct = await database.query(queryText, [
            productId,
            productName,
            productDescription,
            productImage, // เก็บชื่อไฟล์ เช่น "productimage-171024xxx.jpg"
            productbrand,
            price,
            stock || 0
        ]);

        res.status(201).json({
            message: "เพิ่มสินค้าและอัปโหลดรูปภาพสำเร็จ",
            product: newProduct.rows[0],
            imageUrl: `/uploads/${productImage}` // ส่ง URL กลับไปให้หน้าบ้านแสดงผลได้เลย
        });

    } catch (error) {
        console.error("Add Product Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มสินค้า" });
    }
};

export const updateProduct = async (req, res) => {
    const { productid } = req.params;
    const { productName, productDescription, productImage, price, stock } = req.body;

    try {
        // ตรวจสอบว่ามีสินค้านี้จริงไหม
        const checkProduct = await database.query('SELECT * FROM Products WHERE productid = $1', [productid]);
        
        if (checkProduct.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้าที่ต้องการแก้ไข" });
        }

        // อัปเดตข้อมูล (ใช้ COALESCE เพื่อคงค่าเดิมไว้หากไม่ได้ส่งฟิลด์นั้นมา)
        const queryText = `
            UPDATE Products 
            SET productname = COALESCE($1, productname),
                productdescription = COALESCE($2, productdescription),
                productimage = COALESCE($3, productimage),
                price = COALESCE($4, price),
                stock = COALESCE($5, stock)
            WHERE productid = $6
            RETURNING *
        `;

        const result = await database.query(queryText, [
            productName, productDescription, productImage, price, stock, productid
        ]);

        res.status(200).json({
            message: "อัปเดตข้อมูลสินค้าสำเร็จ",
            product: result.rows[0]
        });

    } catch (error) {
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