import database from '../config/database.js';

import crypto from 'crypto'; 
import fs from 'fs';
import path from 'path';

const toImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('/')) return imagePath;
    return `/uploads/${imagePath}`;
};

const normalizeGender = (value) => {
    const raw = String(value || '').trim().toLowerCase();
    if (raw === 'men' || raw === 'women' || raw === 'unisex') return raw;
    return 'unisex';
};

const ensureProductGenderColumn = async () => {
    const columnInfo = await database.query(`
        SELECT column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'products'
          AND column_name IN ('productGender', 'productgender')
    `);

    const hasCamelGender = columnInfo.rows.some((row) => row.column_name === 'productGender');
    const hasLegacyGender = columnInfo.rows.some((row) => row.column_name === 'productgender');

    if (!hasCamelGender) return;

    if (hasLegacyGender) {
        await database.query(`
            UPDATE Products
            SET "productGender" = COALESCE("productGender", NULLIF(TRIM(productgender), ''))
        `);
    }

    await database.query(`
        UPDATE Products
        SET "productGender" = LOWER(TRIM("productGender"))
        WHERE "productGender" IS NOT NULL
    `);

    await database.query(`
        UPDATE Products
        SET "productGender" = 'unisex'
        WHERE "productGender" IS NULL
           OR TRIM("productGender") = ''
           OR "productGender" NOT IN ('men', 'women', 'unisex')
    `);
};

export const addProduct = async (req, res) => {
    // 1. รับข้อมูลจาก req.body (ชื่อตัวแปรให้ตรงกับที่หน้าบ้านจะส่งมา)
    const { productName, productDescription, productBrand, price, stock, productGender } = req.body;

    try {
        // 2. จัดการรูปภาพจาก multer
        const productImage = req.file ? req.file.filename : null;

        if (!productImage) {
            return res.status(400).json({ message: "กรุณาอัปโหลดรูปภาพสินค้า" });
        }

        // 3. สร้าง ID สินค้า
        const productId = `Prd${crypto.randomBytes(4).toString('hex')}`;
        const gender = normalizeGender(productGender);

        await ensureProductGenderColumn();

        // 4. บันทึกข้อมูล (ตรวจสอบชื่อ Column ใน SQL ให้ตรงกับ Schema ของคุณ)
        // จาก SQL ที่คุณให้มา: productId, productName, productDescription, productImage, productBrand, price, stock
        const queryText = `
            INSERT INTO Products (productId, productName, productDescription, productImage, productBrand, price, stock, "productGender") 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
            RETURNING *
        `;

        const newProduct = await database.query(queryText, [
            productId,
            productName,
            productDescription,
            productImage, 
            productBrand,
            price,
            stock || 10, // ตาม Schema ของคุณ DEFAULT คือ 10
            gender,
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
    const { productName, productDescription, productBrand, price, stock, productGender } = req.body;
    
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
        const gender = normalizeGender(productGender || oldProduct.productGender || oldProduct.productgender);

        await ensureProductGenderColumn();

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
                stock = $6,
                "productGender" = $7
            WHERE productid = $8
            RETURNING *
        `;

        const result = await database.query(queryText, [
            productName, 
            productDescription, 
            productImage, 
            productBrand, 
            price, 
            stock, 
            gender,
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
        const usageChecks = [
            { table: 'Cart', column: 'productid' },
            { table: 'Cart', column: 'productId' },
            { table: 'CartItems', column: 'productid' },
            { table: 'CartItems', column: 'productId' },
            { table: 'OrderItems', column: 'productid' },
            { table: 'OrderItems', column: 'productId' },
        ];

        let isInUse = false;

        for (const check of usageChecks) {
            try {
                const checkUsage = await database.query(
                    `SELECT 1 FROM ${check.table} WHERE ${check.column} = $1 LIMIT 1`,
                    [productid]
                );

                if (checkUsage.rowCount > 0) {
                    isInUse = true;
                    break;
                }
            } catch (error) {
                if (error?.code === '42P01' || error?.code === '42703') {
                    continue;
                }
                throw error;
            }
        }

        if (isInUse) {
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
        await ensureProductGenderColumn();
        // ดึงข้อมูลทั้งหมดจากตาราง Products เรียงตามชื่อหรือเวลาที่เพิ่มก็ได้
        const queryText = 'SELECT * FROM Products ORDER BY productname ASC';
        const result = await database.query(queryText);

        const products = result.rows.map((product) => ({
            ...product,
            imageUrl: product.productimage
                ? product.productimage.startsWith('/')
                    ? product.productimage
                    : `/uploads/${product.productimage}`
                : null,
        }));

        res.status(200).json({
            message: "ดึงข้อมูลสินค้าสำเร็จ",
            count: result.rowCount,
            products
        });
    } catch (error) {
        console.error("Get All Products Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า" });
    }
};

export const getProductById = async (req, res) => {
    const productid = String(req.params.productid || '').trim();

    try {
        await ensureProductGenderColumn();
        if (!productid) {
            return res.status(400).json({ message: "กรุณาระบุรหัสสินค้า" });
        }

        const queryText = 'SELECT * FROM Products WHERE productid = $1';
        const result = await database.query(queryText, [productid]);

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้าที่ระบุ" });
        }

        const product = {
            ...result.rows[0],
            imageUrl: toImageUrl(result.rows[0].productimage),
        };

        res.status(200).json({
            message: "ดึงข้อมูลสินค้าสำเร็จ",
            product
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
        await ensureProductGenderColumn();
        // 1. สร้างโครง Query เริ่มต้น
        let query = 'SELECT * FROM Products WHERE 1=1';
        
        const values = [];
        let valueIndex = 1;

        // 2. ตรวจสอบว่ามีการส่ง filter มาหรือไม่
        if (filter) {
            
            // 💡 แก้ไข: เปลี่ยนจาก = เป็น ILIKE เพื่อค้นหาแบบไม่สนใจตัวพิมพ์เล็ก/ใหญ่ 
            // ตัวอย่าง: ถ้าผู้ใช้ส่ง "adidas" ระบบจะเจอทั้ง "Adidas", "ADIDAS", "adidas"
            if (filter.brand) {
                query +=  ` AND productBrand ILIKE $${valueIndex}`;
                values.push(filter.brand); 
                valueIndex++;
            }

            // ถ้ามีระบุ name ให้กรองตาม productName 
            if (filter.name) {
                query +=  ` AND productName ILIKE $${valueIndex}`;
                values.push(`%${filter.name}%`); 
                valueIndex++;
            }

            // ถ้ามีระบุ price ให้กรองตาม price
            if (filter.price !== undefined && filter.price !== null && filter.price !== '') {
                query +=  ` AND price <= $${valueIndex}`; 
                values.push(filter.price);
                valueIndex++;
            }

            if (filter.gender) {
                query += ` AND "productGender" ILIKE $${valueIndex}`;
                values.push(String(filter.gender).trim().toLowerCase());
                valueIndex++;
            }
        }

        // 3. สั่งรัน Query
        const result = await database.query(query, values);

        const products = result.rows.map((product) => ({
            ...product,
            imageUrl: toImageUrl(product.productimage),
        }));

        // 4. ส่งผลลัพธ์กลับไป
        res.status(200).json({
            message: "ค้นหาสินค้าสำเร็จ",
            total_found: products.length,
            products
        });

    } catch (error) {
        console.error('Error filtering products:', error);
        res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' });
    }
};