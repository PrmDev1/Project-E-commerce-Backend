import database from '../config/database.js';

import crypto from 'crypto'; 

export const addToCart = async (req, res) => {
    // ข้อมูลที่หน้าบ้านส่งมา (ต้องเลือก JSON ใน Postman)
    const { userId, productId, quantity, size } = req.body;
    
    // userId ได้มาจาก Middleware ถอดรหัส Token
    //const userId = req.user.id; 

    try {
        const safeQuantity = Math.max(1, Number(quantity) || 1);
        const safeSize = String(size || '').trim();

        if (!safeSize) {
            return res.status(400).json({ message: "กรุณาเลือกไซซ์ก่อนเพิ่มสินค้าลงตะกร้า" });
        }

        const existingQuery = `
            SELECT cartid, quantity
            FROM Cart
            WHERE userid = $1
              AND productid = $2
              AND COALESCE(size, 'Default') = $3
            LIMIT 1
        `;

        const existing = await database.query(existingQuery, [userId, productId, safeSize]);

        if (existing.rows.length > 0) {
            const current = Number(existing.rows[0].quantity) || 0;
            const nextQuantity = current + safeQuantity;

            await database.query(
                `UPDATE Cart SET quantity = $1 WHERE cartid = $2`,
                [nextQuantity, existing.rows[0].cartid]
            );

            return res.status(200).json({
                message: "เพิ่มจำนวนสินค้าในตะกร้าเรียบร้อย",
                cartId: existing.rows[0].cartid,
            });
        }

        // 1. สร้าง cartId แบบสุ่ม (Prefix 'Crt' + hex 8 ตัว)
        const cartid = `Crt${crypto.randomBytes(4).toString('hex')}`;

        // 2. INSERT โดยใช้ชื่อคอลัมน์ตัวเล็กตามภาพตารางของคุณ
        const queryText = `
            INSERT INTO Cart (cartid, userid, productid, quantity, size) 
            VALUES ($1, $2, $3, $4, $5)
        `;
        
        await database.query(queryText, [
            cartid, 
            userId, 
            productId, 
            safeQuantity, 
            safeSize
        ]);

        res.status(200).json({ 
            message: "เพิ่มสินค้าลงตะกร้าเรียบร้อย",
            cartId: cartid 
        });

    } catch (error) {
        console.error("Add to Cart Error:", error);
        res.status(500).json({ message: "ไม่สามารถเพิ่มสินค้าได้" });
    }
};

export const updateCart = async (req, res) => {
    // รับ cartId จาก params และข้อมูลที่จะแก้จาก body
    const { cartid } = req.params; 
    const { quantity } = req.body;

    try {
        // ตรวจสอบก่อนว่ามีรายการนี้ในตะกร้าจริงไหม
        const checkCart = await database.query('SELECT * FROM Cart WHERE cartid = $1', [cartid]);
        
        if (checkCart.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบรายการสินค้าในตะกร้า" });
        }

        // เริ่มทำการ UPDATE เฉพาะฟิลด์ quantity 
        const queryText = `
            UPDATE Cart 
            SET quantity = $1 
            WHERE cartid = $2 
            RETURNING *
        `;

        const updatedResult = await database.query(queryText, [quantity, cartid]);

        res.status(200).json({
            message: "แก้ไขข้อมูลในตะกร้าสำเร็จ",
            updatedItem: updatedResult.rows[0]
        });

    } catch (error) {
        console.error("Update Cart Error:", error);
        res.status(500).json({ message: "ไม่สามารถแก้ไขข้อมูลได้" });
    }
};

export const deleteFromCart = async (req, res) => {
    const { cartid } = req.params;

    try {
        const deleteResult = await database.query(
            'DELETE FROM Cart WHERE cartid = $1 RETURNING *',
            [cartid]
        );

        if (deleteResult.rowCount === 0) {
            return res.status(404).json({ message: "ไม่พบรายการที่ต้องการลบ" });
        }

        res.status(200).json({
            message: "ลบสินค้าออกจากตะกร้าเรียบร้อยแล้ว",
            deletedId: cartid
        });

    } catch (error) {
        console.error("Delete Cart Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการลบสินค้า" });
    }
};

export const getAllCartByUserId = async (req, res) => {
    // รับ userId จาก params (เช่น /cart/:userId) 
    // หรือจาก req.user.userId ถ้าคุณทำระบบ Login/Auth ไว้
    const { userId } = req.params; 

    try {
        // ใช้ INNER JOIN เพื่อดึงรายละเอียดสินค้าจากตาราง Products มาพร้อมกับข้อมูลใน Cart
        const queryText = `
            SELECT 
                c.cartId, 
                c.productId, 
                c.quantity, 
                c.size,
                p.productName, 
                p.productImage, 
                p.productBrand,
                p.productDescription, 
                p.price,
                (p.price * c.quantity) AS subtotal
            FROM Cart c
            JOIN Products p ON c.productId = p.productId
            WHERE c.userId = $1
        `;

        const result = await database.query(queryText, [userId]);


        if (result.rows.length === 0) {
            return res.status(200).json({ 
                message: "ตะกร้าสินค้าว่างเปล่า", 
                cart: []
            });
        }

        res.status(200).json({
            message: "ดึงข้อมูลตะกร้าสินค้าสำเร็จ",
            count: result.rowCount,
            cart: result.rows
        });

    } catch (error) {
        console.error("Get Cart Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้าสินค้า" });
    }
};
//จ่ายเงินโดยใช้ cart
export const getCheckoutDetails = async (req, res) => {
    // รับ cartIds (Array) และ userId จาก Body
    const { cartIds, userId } = req.body;

    try {
        // 1. ตรวจสอบว่าส่งข้อมูลมาครบถ้วนไหม
        if (!cartIds || !Array.isArray(cartIds) || cartIds.length === 0) {
            return res.status(400).json({ message: "กรุณาเลือกสินค้าที่ต้องการชำระเงิน" });
        }

        // 2. ดึงข้อมูลสินค้าจาก Cart + Products (เฉพาะ ID ที่เลือกมา)
        // ใช้ ANY($1) เพื่อรองรับ Array ของ cartId ใน PostgreSQL
        const cartQuery = `
            SELECT 
                c.cartId, 
                c.quantity, 
                c.size, 
                p.productid, 
                p.productname, 
                p.productimage, 
                p.price,
                (p.price * c.quantity) AS itemTotal
            FROM Cart c
            JOIN Products p ON c.productid = p.productid
            WHERE c.cartId = ANY($1)
        `;
        const cartResult = await database.query(cartQuery, [cartIds]);

        // 3. ดึงที่อยู่ทั้งหมดของ User นี้
        const addressQuery = `
            SELECT * FROM addresses 
            WHERE userId = $1
        `;
        const addressResult = await database.query(addressQuery, [userId]);

        // 4. คำนวณยอดรวมสุทธิ (Grand Total)
        const grandTotal = cartResult.rows.reduce((sum, item) => sum + Number(item.itemtotal), 0);

        // 5. ส่งข้อมูลกลับไปให้ Frontend
        res.status(200).json({
            message: "ดึงข้อมูลสำหรับชำระเงินสำเร็จ",
            checkoutData: {
                items: cartResult.rows,
                totalAmount: grandTotal,
                availableAddresses: addressResult.rows
            }
        });

    } catch (error) {
        console.error("Checkout Details Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการเตรียมข้อมูลชำระเงิน" });
    }
};

export const createOrderByCart = async (req, res) => {
    const { userId, addressId, cartIds } = req.body;

    try {
        // เริ่ม Transaction
        await database.query('BEGIN');

        // 1. ดึงข้อมูลสินค้าจาก Cart เพื่อนำมาคำนวณราคาสุทธิและเตรียมข้อมูล OrderItems
        const cartItemsQuery = `
            SELECT c.productId, c.quantity, c.size, p.price, p.stock
            FROM Cart c
            JOIN Products p ON c.productId = p.productId
            WHERE c.cartId = ANY($1) AND c.userId = $2
        `;
        const cartItemsResult = await database.query(cartItemsQuery, [cartIds, userId]);

        if (cartItemsResult.rows.length === 0) {
            throw new Error("ไม่พบสินค้าในตะกร้าที่เลือก");
        }

        // 2. คำนวณยอดรวม (Total Amount)
        const totalAmount = cartItemsResult.rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);

        // 3. สร้าง Order หลัก (ตาราง Orders)
        const orderId = `Ord${crypto.randomBytes(4).toString('hex')}`;
        const createOrderQuery = `
            INSERT INTO Orders (orderId, userId, addressId, totalAmount, status)
            VALUES ($1, $2, $3, $4, 'Pending')
            RETURNING *
        `;
        await database.query(createOrderQuery, [orderId, userId, addressId, totalAmount]);

        // 4. วนลูปสร้าง OrderItems และ ตัดสต็อกสินค้า
        for (const item of cartItemsResult.rows) {
            // เช็คสต็อกก่อนว่าพอไหม
            if (item.stock < item.quantity) {
                throw new Error(`สินค้าบางรายการมีสต็อกไม่พอ (เหลือเพียง ${item.stock} ชิ้น)`);
            }

            const itemId = `Itm${crypto.randomBytes(4).toString('hex')}`;
            
            // เพิ่มลงตาราง OrderItems
            await database.query(`
                INSERT INTO OrderItems (itemId, orderId, productId, quantity, size, price)
                VALUES ($1, $2, $3, $4, $5, $6)
            `, [itemId, orderId, item.productid, item.quantity, item.size, item.price]);

            // ตัดสต็อกในตาราง Products
            await database.query(`
                UPDATE Products SET stock = stock - $1 WHERE productId = $2
            `, [item.quantity, item.productid]);
        }

        // 5. ลบสินค้าออกจากตะกร้า (Cart) หลังจากสั่งซื้อเสร็จ
        await database.query(`DELETE FROM Cart WHERE cartId = ANY($1)`, [cartIds]);

        // จบ Transaction (บันทึกข้อมูลทั้งหมดลง DB)
        await database.query('COMMIT');

        res.status(201).json({
            message: "สร้างคำสั่งซื้อสำเร็จ",
            orderId: orderId,
            totalAmount: totalAmount
        });

    } catch (error) {
        // หากเกิดข้อผิดพลาด ให้ยกเลิกคำสั่งทั้งหมดที่ทำมาใน Transaction นี้ (Rollback)
        await database.query('ROLLBACK');
        console.error("Create Order Error:", error);
        res.status(500).json({ message: error.message || "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ" });
    }
};

export const updateOrderStatus = async (req, res) => {
    // รับ orderid จาก params (เช่น /orders/status/Ord123) 
    // หรือจะรับจาก body ก็ได้ครับ ในที่นี้ผมใช้ params เพื่อความสะดวก
    const { orderid } = req.params;

    try {
        // 1. ตรวจสอบก่อนว่ามี Order นี้อยู่ในระบบจริงไหม
        const checkOrder = await database.query(
            'SELECT status FROM orders WHERE orderid = $1',
            [orderid]
        );

        if (checkOrder.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบคำสั่งซื้อที่ระบุ" });
        }

        // 2. อัปเดตสถานะเป็น 'Success'
        const queryText = `
            UPDATE Orders 
            SET status = 'Success' 
            WHERE orderid = $1 
            RETURNING *
        `;
        
        const result = await database.query(queryText, [orderid]);

        res.status(200).json({
            message: "อัปเดตสถานะคำสั่งซื้อสำเร็จ",
            order: result.rows[0]
        });

    } catch (error) {
        console.error("Update Order Status Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตสถานะ" });
    }
};

//No cart 
export const CheckoutSingleProduct = async (req, res) => {
    // เปลี่ยนมารับ productId, userId, และข้อมูลเสริมที่จำเป็นจาก Body
    const { productId, userId, quantity, size } = req.body;

    try {
        if (!productId || !userId) {
            return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
        }

        // 1. ดึงข้อมูลสินค้าตัวที่จะซื้อ
        const productQuery = `SELECT * FROM Products WHERE productid = $1`;
        const productResult = await database.query(productQuery, [productId]);

        if (productResult.rows.length === 0) {
            return res.status(404).json({ message: "ไม่พบสินค้า" });
        }

        const product = productResult.rows[0];
        const itemTotal = product.price * (quantity || 1);

        // 2. ดึงที่อยู่
        const addressQuery = `SELECT * FROM Addresses WHERE userId = $1`;
        const addressResult = await database.query(addressQuery, [userId]);

        res.status(200).json({
            message: "ดึงข้อมูลชำระเงินสำเร็จ",
            checkoutData: {
                items: [{
                    productid: product.productid,
                    productname: product.productname,
                    productimage: product.productimage,
                    price: product.price,
                    quantity: quantity || 1,
                    size: size || 'N/A',
                    itemTotal: itemTotal
                }],
                totalAmount: itemTotal,
                availableAddresses: addressResult.rows
            }
        });
    } catch (error) {
        console.error("Single Checkout Error:", error);
        res.status(500).json({ message: "เกิดข้อผิดพลาด" });
    }
};

export const createOrderDirect = async (req, res) => {
    const { userId, addressId, productId, quantity, size } = req.body;

    try {
        await database.query('BEGIN');

        // 1. ตรวจสอบสินค้าและราคาปัจจุบัน
        const productCheck = await database.query('SELECT price, stock FROM Products WHERE productid = $1', [productId]);
        if (productCheck.rows.length === 0) throw new Error("ไม่พบสินค้า");
        
        const product = productCheck.rows[0];
        if (product.stock < quantity) throw new Error("สินค้าในสต็อกไม่พอ");

        const totalAmount = product.price * quantity;

        // 2. สร้าง Order หลัก
        const orderId = `Ord${crypto.randomBytes(4).toString('hex')}`;
        await database.query(`
            INSERT INTO Orders (orderId, userId, addressId, totalAmount, status)
            VALUES ($1, $2, $3, $4, 'Pending')
        `, [orderId, userId, addressId, totalAmount]);

        // 3. สร้าง OrderItem (เนื่องจากซื้อชิ้นเดียว ก็จะมีแค่ 1 row)
        const itemId = `Itm${crypto.randomBytes(4).toString('hex')}`;
        await database.query(`
            INSERT INTO OrderItems (itemId, orderId, productId, quantity, size, price)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [itemId, orderId, productId, quantity, size, product.price]);

        // 4. ตัดสต็อก
        await database.query(`UPDATE Products SET stock = stock - $1 WHERE productid = $2`, [quantity, productId]);

        await database.query('COMMIT');
        res.status(201).json({ message: "สร้างคำสั่งซื้อสำเร็จ", orderId });

    } catch (error) {
        await database.query('ROLLBACK');
        res.status(500).json({ message: error.message });
    }
};