import express from 'express';
import { register, login, addAddress, getMyAddresses, getAllUsers, editUserProfile, getAllOrderHistory, getMyPaidOrderHistory } from '../controllers/userController.js';
import { verifyToken, verifyRole } from '../middleware/verifyToken.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: ระบบจัดการผู้ใช้งาน (สมัครสมาชิก, เข้าสู่ระบบ)
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: สมัครสมาชิกใหม่
 *     description: สร้างบัญชีผู้ใช้ใหม่ และเข้าสู่ระบบอัตโนมัติด้วย JWT Cookie
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "12345678"
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: "user"
 *     responses:
 *       201:
 *         description: ลงทะเบียนและเข้าสู่ระบบสำเร็จ
 *         headers:
 *           Set-Cookie:
 *             description: JWT token ถูกส่งกลับใน httpOnly cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ลงทะเบียนและเข้าสู่ระบบสำเร็จ"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "Usr1a2b3c1234"
 *                     name:
 *                       type: string
 *                       example: "john_doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     role:
 *                       type: string
 *                       example: "user"
 *       400:
 *         description: Email ถูกใช้งานแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email นี้ถูกใช้งานแล้ว"
 *       500:
 *         description: เกิดข้อผิดพลาดที่เซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"
 */
router.post('/register', register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: เข้าสู่ระบบ
 *     description: ตรวจสอบ Email และ Password และสร้าง JWT Token ส่งกลับใน httpOnly Cookie
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               password:
 *                 type: string
 *                 format: password
 *                 example: "12345678"
 *     responses:
 *       200:
 *         description: เข้าสู่ระบบสำเร็จ
 *         headers:
 *           Set-Cookie:
 *             description: JWT token ถูกส่งกลับใน httpOnly cookie
 *             schema:
 *               type: string
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เข้าสู่ระบบสำเร็จ"
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: "Usr1a2b3c1234"
 *                     name:
 *                       type: string
 *                       example: "john_doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *       401:
 *         description: รหัสผ่านไม่ถูกต้อง
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "รหัสผ่านไม่ถูกต้อง"
 *       404:
 *         description: ไม่พบผู้ใช้งานด้วย Email นี้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบผู้ใช้งานด้วย Email นี้"
 *       500:
 *         description: เกิดข้อผิดพลาดที่เซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์"
 */
router.post('/login', login);

/**
 * @swagger
 * /api/addresses:
 *   post:
 *     summary: เพิ่มที่อยู่ใหม่
 *     description: เพิ่มที่อยู่ของผู้ใช้งาน (ต้องเข้าสู่ระบบก่อน)
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - province
 *               - district
 *               - locality
 *               - postCode
 *               - name
 *               - number
 *             properties:
 *               province:
 *                 type: string
 *                 example: "กรุงเทพมหานคร"
 *               district:
 *                 type: string
 *                 example: "บางเขน"
 *               locality:
 *                 type: string
 *                 example: "อนุสาวรีย์"
 *               postCode:
 *                 type: string
 *                 example: "10220"
 *               name:
 *                 type: string
 *                 example: "สมชาย ใจดี"
 *               number:
 *                 type: string
 *                 example: "99/123 หมู่บ้านสุขใจ"
 *               note:
 *                 type: string
 *                 example: "บ้านสีขาว มีรถกระบะจอดหน้าบ้าน"
 *     responses:
 *       201:
 *         description: เพิ่มที่อยู่สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เพิ่มที่อยู่สำเร็จ"
 *                 address:
 *                   type: object
 *       401:
 *         description: ไม่ได้รับอนุญาต (ไม่ได้เข้าสู่ระบบ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *       500:
 *         description: ไม่สามารถเพิ่มที่อยู่ได้
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่สามารถเพิ่มที่อยู่ได้"
 */
router.post('/add-address', verifyToken, addAddress);
router.get('/addresses', verifyToken, getMyAddresses);

/**
 * @swagger
 * /api/users/all-users:
 *   get:
 *     summary: ดึงข้อมูลผู้ใช้งานทั้งหมด (เฉพาะ Admin)
 *     description: ดึงรายชื่อและข้อมูลพื้นฐานของผู้ใช้งานทุกคนในระบบ (ไม่รวมรหัสผ่าน) จำเป็นต้องเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์เป็น 'admin'
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลผู้ใช้ทั้งหมดสำเร็จ"
 *                 total_users:
 *                   type: integer
 *                   description: จำนวนผู้ใช้งานทั้งหมดในระบบ
 *                   example: 2
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userid:
 *                         type: string
 *                         example: "Usd8f2a1b1234"
 *                       username:
 *                         type: string
 *                         example: "pongpak"
 *                       email:
 *                         type: string
 *                         example: "pongpak@example.com"
 *                       role:
 *                         type: string
 *                         example: "member"
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ (ไม่มี Token ใน Cookie)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "กรุณาเข้าสู่ระบบก่อนทำรายการ"
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง (ไม่ใช่ Admin หรือ Token หมดอายุ)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้"
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลผู้ใช้ออกจากระบบ"
 */
router.get('/all-users', verifyToken, verifyRole(['admin']), getAllUsers);

/**
 * @swagger
 * /api/users/edit-profile:
 *   patch:
 *     summary: แก้ไขข้อมูลโปรไฟล์ผู้ใช้งาน (เฉพาะ Admin)
 *     description: อัปเดตข้อมูลของผู้ใช้งาน เช่น ชื่อ, อีเมล, และระดับสิทธิ์ โดยอ้างอิงจาก userid จำเป็นต้องเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์เป็น 'admin'
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userid
 *             properties:
 *               userid:
 *                 type: string
 *                 description: รหัสผู้ใช้งานที่ต้องการแก้ไข (ห้ามว่าง)
 *                 example: "Usd8f2a1b1234"
 *               username:
 *                 type: string
 *                 description: ชื่อผู้ใช้งานใหม่ที่ต้องการอัปเดต
 *                 example: "pongpak_dev"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: อีเมลใหม่ (ต้องไม่ซ้ำกับคนอื่นในระบบ)
 *                 example: "pongpak_dev@example.com"
 *               role:
 *                 type: string
 *                 description: ระดับสิทธิ์ใหม่ที่ต้องการเปลี่ยน (เช่น 'member', 'admin')
 *                 example: "admin"
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลผู้ใช้สำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "อัปเดตข้อมูลผู้ใช้สำเร็จ"
 *                 user:
 *                   type: object
 *                   properties:
 *                     userid:
 *                       type: string
 *                       example: "Usd8f2a1b1234"
 *                     username:
 *                       type: string
 *                       example: "pongpak_dev"
 *                     email:
 *                       type: string
 *                       example: "pongpak_dev@example.com"
 *                     role:
 *                       type: string
 *                       example: "admin"
 *       400:
 *         description: ส่งข้อมูลมาไม่ครบ หรือ อีเมลซ้ำในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Email นี้มีคนใช้งานในระบบแล้ว กรุณาใช้ Email อื่น"
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ (ไม่มี Token ใน Cookie)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "กรุณาเข้าสู่ระบบก่อนทำรายการ"
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง (ไม่ใช่ Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้"
 *       404:
 *         description: หาผู้ใช้งานไม่เจอ (อาจจะถูกลบไปแล้ว หรือส่ง userid ผิด)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบผู้ใช้งานนี้ในระบบ"
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลผู้ใช้"
 */
router.patch('/edit-profile', verifyToken, verifyRole(['admin']), editUserProfile);

/**
 * @swagger
 * /api/users/history:
 *   get:
 *     summary: ดึงประวัติการสั่งซื้อของผู้ใช้งานทุกคน (เฉพาะ Admin)
 *     description: ดึงข้อมูลผู้ใช้งานทั้งหมดพร้อมประวัติการสั่งซื้อแต่ละบิล และรายการสินค้าในบิลนั้นๆ (แสดงผู้ใช้ทุกคนแม้จะยังไม่เคยสั่งซื้อก็ตาม) จำเป็นต้องเข้าสู่ระบบด้วยบัญชีที่มีสิทธิ์เป็น 'admin'
 *     tags: [Users]
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: ดึงข้อมูลผู้ใช้และประวัติการสั่งซื้อทั้งหมดสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลผู้ใช้และประวัติการสั่งซื้อทั้งหมดสำเร็จ"
 *                 total_users:
 *                   type: integer
 *                   description: จำนวนผู้ใช้งานทั้งหมดในระบบ
 *                   example: 2
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       userid:
 *                         type: string
 *                         example: "Usd8f2a1b1234"
 *                       username:
 *                         type: string
 *                         example: "pongpak"
 *                       email:
 *                         type: string
 *                         example: "pongpak@example.com"
 *                       order_history:
 *                         type: array
 *                         description: ประวัติการสั่งซื้อของผู้ใช้งาน (ถ้าไม่มีจะเป็น Array ว่าง [])
 *                         items:
 *                           type: object
 *                           properties:
 *                             orderid:
 *                               type: string
 *                               example: "ORD-001"
 *                             addressid:
 *                               type: string
 *                               example: "ADDR-99"
 *                             totalamount:
 *                               type: number
 *                               example: 9700
 *                             status:
 *                               type: string
 *                               example: "Success"
 *                             datetime:
 *                               type: string
 *                               format: date-time
 *                               example: "2026-03-01T08:20:00.000Z"
 *                             items:
 *                               type: array
 *                               description: รายการสินค้าในบิลนี้
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   itemid:
 *                                     type: string
 *                                     example: "ITM-01"
 *                                   productid:
 *                                     type: string
 *                                     example: "PRD-001"
 *                                   productname:
 *                                     type: string
 *                                     example: "Adidas Supernova Rise 2"
 *                                   quantity:
 *                                     type: integer
 *                                     example: 1
 *                                   size:
 *                                     type: string
 *                                     example: "42"
 *                                   price:
 *                                     type: number
 *                                     example: 4500
 *       401:
 *         description: ไม่ได้เข้าสู่ระบบ (ไม่มี Token ใน Cookie)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "กรุณาเข้าสู่ระบบก่อนทำรายการ"
 *       403:
 *         description: ไม่มีสิทธิ์เข้าถึง (ไม่ใช่ Admin)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ถูกปฏิเสธ: คุณไม่มีสิทธิ์เข้าถึงฟังก์ชันนี้"
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการสั่งซื้อ"
 */
router.get('/history', verifyToken, verifyRole(["admin"]), getAllOrderHistory);
router.get('/my-history', verifyToken, getMyPaidOrderHistory);

export default router;