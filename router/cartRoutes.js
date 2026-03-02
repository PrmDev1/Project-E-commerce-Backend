import express from 'express';
import { addToCart, updateCart, deleteFromCart, getAllCartByUserId, getCheckoutDetails, createOrderByCart, updateOrderStatus, CheckoutSingleProduct, createOrderDirect } from '../controllers/cartController.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: ระบบจัดการตะกร้าสินค้า (เพิ่ม, แก้ไข, ลบ, ดึงข้อมูลตะกร้า)
 */
/**
 * @swagger
 * /api/cart/add-to-cart:
 *   post:
 *     summary: เพิ่มสินค้าลงในตะกร้า (Add to Cart)
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - productId
 *               - quantity
 *               - size
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID ของผู้ใช้งาน
 *                 example: "usr_12345"
 *               productId:
 *                 type: string
 *                 description: ID ของสินค้า
 *                 example: "prod_67890"
 *               quantity:
 *                 type: integer
 *                 description: จำนวนสินค้า
 *                 example: 1
 *               size:
 *                 type: string
 *                 description: ขนาดของสินค้า (เช่น S, M, L, XL)
 *                 example: "L"
 *     responses:
 *       200:
 *         description: เพิ่มสินค้าลงตะกร้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เพิ่มสินค้าลงตะกร้าเรียบร้อย"
 *                 cartId:
 *                   type: string
 *                   example: "Crt1a2b3c4d"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่สามารถเพิ่มสินค้าได้"
 */
router.post('/add-to-cart', addToCart);

/**
 * @swagger
 * /api/cart/{cartid}:
 *   put:
 *     summary: แก้ไขจำนวนสินค้าในตะกร้า
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cartid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสรายการสินค้าในตะกร้า
 *         example: "Crt1a2b3c4d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 description: จำนวนสินค้าที่ต้องการแก้ไข
 *                 example: 2
 *     responses:
 *       200:
 *         description: แก้ไขข้อมูลในตะกร้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "แก้ไขข้อมูลในตะกร้าสำเร็จ"
 *                 updatedItem:
 *                   type: object
 *                   description: ข้อมูลรายการสินค้าที่ถูกแก้ไขแล้ว
 *       404:
 *         description: ไม่พบรายการสินค้าในตะกร้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบรายการสินค้าในตะกร้า"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่สามารถแก้ไขข้อมูลได้"
 */
router.put('/update-cart/:cartid', updateCart);

/**
 * @swagger
 * /api/cart/{userId}:
 *   get:
 *     summary: ดึงข้อมูลตะกร้าสินค้าทั้งหมดตาม userId
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสผู้ใช้งาน
 *         example: "usr_12345"
 *     responses:
 *       200:
 *         description: ดึงข้อมูลตะกร้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลตะกร้าสินค้าสำเร็จ"
 *                 count:
 *                   type: integer
 *                   example: 2
 *                 cart:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       cartId:
 *                         type: string
 *                         example: "Crt1a2b3c4d"
 *                       productId:
 *                         type: string
 *                         example: "prod_67890"
 *                       quantity:
 *                         type: integer
 *                         example: 2
 *                       size:
 *                         type: string
 *                         example: "L"
 *                       productName:
 *                         type: string
 *                         example: "Nike Air Max"
 *                       productImage:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       productBrand:
 *                         type: string
 *                         example: "Nike"
 *                       productDescription:
 *                         type: string
 *                         example: "รองเท้าวิ่งน้ำหนักเบา"
 *                       price:
 *                         type: number
 *                         format: float
 *                         example: 3500
 *                       subtotal:
 *                         type: number
 *                         format: float
 *                         example: 7000
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลตะกร้าสินค้า"
 */
router.get('/get-cart/:userId', getAllCartByUserId);

/**
 * @swagger
 * /api/cart/{cartid}:
 *   delete:
 *     summary: ลบสินค้าออกจากตะกร้า
 *     tags: [Cart]
 *     parameters:
 *       - in: path
 *         name: cartid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสรายการสินค้าในตะกร้า
 *         example: "Crt1a2b3c4d"
 *     responses:
 *       200:
 *         description: ลบสินค้าออกจากตะกร้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ลบสินค้าออกจากตะกร้าเรียบร้อยแล้ว"
 *                 deletedId:
 *                   type: string
 *                   example: "Crt1a2b3c4d"
 *       404:
 *         description: ไม่พบรายการที่ต้องการลบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบรายการที่ต้องการลบ"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการลบสินค้า"
 */
router.delete('/delete-from-cart/:cartid', deleteFromCart);

/**
 * @swagger
 * /api/cart/checkout-details:
 *   post:
 *     summary: ดึงข้อมูลสำหรับหน้าชำระเงิน (Checkout)
 *     tags: [Cart]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cartIds
 *               - userId
 *             properties:
 *               cartIds:
 *                 type: array
 *                 description: รายการ cartId ที่ต้องการชำระเงิน
 *                 items:
 *                   type: string
 *                 example: ["Crt1a2b3c4d", "Crt5e6f7g8h"]
 *               userId:
 *                 type: string
 *                 description: รหัสผู้ใช้งาน
 *                 example: "usr_12345"
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสำหรับชำระเงินสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลสำหรับชำระเงินสำเร็จ"
 *                 checkoutData:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           cartId:
 *                             type: string
 *                             example: "Crt1a2b3c4d"
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           size:
 *                             type: string
 *                             example: "L"
 *                           productid:
 *                             type: string
 *                             example: "prod_67890"
 *                           productname:
 *                             type: string
 *                             example: "Nike Air Max"
 *                           productimage:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                           price:
 *                             type: number
 *                             format: float
 *                             example: 3500
 *                           itemtotal:
 *                             type: number
 *                             format: float
 *                             example: 7000
 *                     totalAmount:
 *                       type: number
 *                       format: float
 *                       example: 7000
 *                     availableAddresses:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: ข้อมูลที่ส่งมาไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "กรุณาเลือกสินค้าที่ต้องการชำระเงิน"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการเตรียมข้อมูลชำระเงิน"
 */
router.get('/checkout-details', getCheckoutDetails);

/**
 * @swagger
 * /api/orders/create:
 *   post:
 *     summary: สร้างคำสั่งซื้อจากรายการสินค้าในตะกร้า
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - addressId
 *               - cartIds
 *             properties:
 *               userId:
 *                 type: string
 *                 description: รหัสผู้ใช้งาน
 *                 example: "usr_12345"
 *               addressId:
 *                 type: string
 *                 description: รหัสที่อยู่สำหรับจัดส่ง
 *                 example: "addr_67890"
 *               cartIds:
 *                 type: array
 *                 description: รายการ cartId ที่ต้องการสั่งซื้อ
 *                 items:
 *                   type: string
 *                 example: ["Crt1a2b3c4d", "Crt5e6f7g8h"]
 *     responses:
 *       201:
 *         description: สร้างคำสั่งซื้อสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "สร้างคำสั่งซื้อสำเร็จ"
 *                 orderId:
 *                   type: string
 *                   example: "Ord1a2b3c4d"
 *                 totalAmount:
 *                   type: number
 *                   format: float
 *                   example: 7500
 *       500:
 *         description: เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการสร้างคำสั่งซื้อ"
 */
router.post('/create-order', createOrderByCart);

/**
 * @swagger
 * /api/orders/status/{orderid}:
 *   put:
 *     summary: อัปเดตสถานะคำสั่งซื้อเป็น Success
 *     tags: [Orders]
 *     parameters:
 *       - in: path
 *         name: orderid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสคำสั่งซื้อที่ต้องการอัปเดตสถานะ
 *         example: "Ord1a2b3c4d"
 *     responses:
 *       200:
 *         description: อัปเดตสถานะคำสั่งซื้อสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "อัปเดตสถานะคำสั่งซื้อสำเร็จ"
 *                 order:
 *                   type: object
 *                   properties:
 *                     orderid:
 *                       type: string
 *                       example: "Ord1a2b3c4d"
 *                     userid:
 *                       type: string
 *                       example: "usr_12345"
 *                     addressid:
 *                       type: string
 *                       example: "addr_67890"
 *                     totalamount:
 *                       type: number
 *                       example: 7500
 *                     status:
 *                       type: string
 *                       example: "Success"
 *       404:
 *         description: ไม่พบคำสั่งซื้อที่ระบุ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบคำสั่งซื้อที่ระบุ"
 *       500:
 *         description: เกิดข้อผิดพลาดในการอัปเดตสถานะ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการอัปเดตสถานะ"
 */
router.put('/update-order-status/:orderid', updateOrderStatus);

/**
 * @swagger
 * /api/checkout/single:
 *   post:
 *     summary: ดึงข้อมูลสำหรับชำระเงินสินค้าแบบชิ้นเดียว
 *     tags: [Checkout]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - userId
 *             properties:
 *               productId:
 *                 type: string
 *                 description: รหัสสินค้าที่ต้องการซื้อ
 *                 example: "prd_12345"
 *               userId:
 *                 type: string
 *                 description: รหัสผู้ใช้งาน
 *                 example: "usr_67890"
 *               quantity:
 *                 type: integer
 *                 description: จำนวนสินค้าที่ต้องการซื้อ
 *                 example: 2
 *               size:
 *                 type: string
 *                 description: ขนาดสินค้า (ถ้ามี)
 *                 example: "L"
 *     responses:
 *       200:
 *         description: ดึงข้อมูลชำระเงินสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลชำระเงินสำเร็จ"
 *                 checkoutData:
 *                   type: object
 *                   properties:
 *                     items:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           productid:
 *                             type: string
 *                             example: "prd_12345"
 *                           productname:
 *                             type: string
 *                             example: "Nike Air Max"
 *                           productimage:
 *                             type: string
 *                             example: "https://example.com/image.jpg"
 *                           price:
 *                             type: number
 *                             example: 2500
 *                           quantity:
 *                             type: integer
 *                             example: 2
 *                           size:
 *                             type: string
 *                             example: "L"
 *                           itemTotal:
 *                             type: number
 *                             example: 5000
 *                     totalAmount:
 *                       type: number
 *                       example: 5000
 *                     availableAddresses:
 *                       type: array
 *                       items:
 *                         type: object
 *       400:
 *         description: ข้อมูลไม่ครบถ้วน
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ข้อมูลไม่ครบถ้วน"
 *       404:
 *         description: ไม่พบสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบสินค้า"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาด"
 */
router.post('/checkout-single-product', CheckoutSingleProduct);

/**
 * @swagger
 * /api/orders/direct:
 *   post:
 *     summary: สร้างคำสั่งซื้อโดยตรง (ซื้อสินค้า 1 รายการทันที)
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - addressId
 *               - productId
 *               - quantity
 *             properties:
 *               userId:
 *                 type: string
 *                 description: รหัสผู้ใช้งาน
 *                 example: "usr_12345"
 *               addressId:
 *                 type: string
 *                 description: รหัสที่อยู่จัดส่ง
 *                 example: "addr_67890"
 *               productId:
 *                 type: string
 *                 description: รหัสสินค้าที่ต้องการซื้อ
 *                 example: "prd_112233"
 *               quantity:
 *                 type: integer
 *                 description: จำนวนสินค้าที่ต้องการซื้อ
 *                 example: 2
 *               size:
 *                 type: string
 *                 description: ขนาดสินค้า (ถ้ามี)
 *                 example: "L"
 *     responses:
 *       201:
 *         description: สร้างคำสั่งซื้อสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "สร้างคำสั่งซื้อสำเร็จ"
 *                 orderId:
 *                   type: string
 *                   example: "Ord1a2b3c4d"
 *       400:
 *         description: ข้อมูลไม่ถูกต้องหรือสต็อกไม่พอ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "สินค้าในสต็อกไม่พอ"
 *       500:
 *         description: เกิดข้อผิดพลาดภายในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาด"
 */
router.post('/create-order-direct', createOrderDirect);

export default router;