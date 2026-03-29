import express from 'express';
import {addProduct, updateProduct, deleteProduct, getAllProducts, getProductById, getProductWithFilter} from '../controllers/productController.js';
import { upload } from '../middleware/uploadMiddleware.js';

const router = express.Router();
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: ระบบจัดการสินค้า (เพิ่ม, แก้ไข, ลบ, ค้นหา)
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: ดึงข้อมูลสินค้าทั้งหมด
 *     description: ดึงรายการสินค้าทั้งหมดที่มีอยู่ในระบบ (ไม่ต้องใช้ Token)
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสินค้าสำเร็จ (คืนค่ากลับมาเป็น Array ของสินค้าโดยตรง)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   productid:
 *                     type: string
 *                     description: รหัสสินค้า
 *                     example: "PRD-001"
 *                   productname:
 *                     type: string
 *                     description: ชื่อสินค้า
 *                     example: "Adidas Supernova Rise 2"
 *                   productbrand:
 *                     type: string
 *                     description: แบรนด์สินค้า
 *                     example: "Adidas"
 *                   price:
 *                     type: number
 *                     description: ราคาสินค้า
 *                     example: 4500
 *                   productimage:
 *                     type: string
 *                     description: URL ของรูปภาพสินค้า
 *                     example: "https://example.com/shoes/supernova.jpg"
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า"
 */
router.get('/getAllProducts', getAllProducts);

/**
 * @swagger
 * /api/products/{productid}:
 *   get:
 *     summary: ดึงข้อมูลสินค้าตาม productId
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสสินค้าที่ต้องการดึงข้อมูล
 *         example: "prd_112233"
 *     responses:
 *       200:
 *         description: ดึงข้อมูลสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ดึงข้อมูลสินค้าสำเร็จ"
 *                 product:
 *                   type: object
 *                   properties:
 *                     productid:
 *                       type: string
 *                       example: "prd_112233"
 *                     productname:
 *                       type: string
 *                       example: "Nike Air Max"
 *                     description:
 *                       type: string
 *                       example: "รองเท้าวิ่งน้ำหนักเบา"
 *                     price:
 *                       type: number
 *                       example: 2500
 *                     stock:
 *                       type: integer
 *                       example: 15
 *                     productimage:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *       404:
 *         description: ไม่พบสินค้าที่ระบุ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบสินค้าที่ระบุ"
 *       500:
 *         description: เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า"
 */
router.get('/get-product/:productid', getProductById);

// ใช้กับ search และ filter brand
/**
 * @swagger
 * /api/products/filter:
 *   post:
 *     summary: ค้นหาสินค้าตามเงื่อนไข (Filter)
 *     description: ค้นหาและดึงข้อมูลสินค้าโดยสามารถกรองตามชื่อแบรนด์, คำที่มีในชื่อสินค้า, และกำหนดเพดานราคาได้ (ส่งข้อมูลผ่าน Body)
 *     tags: [Products]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filter:
 *                 type: object
 *                 properties:
 *                   brand:
 *                     type: string
 *                     description: ชื่อแบรนด์ที่ต้องการค้นหา (ระบบจะไม่สนใจตัวพิมพ์เล็ก/ใหญ่)
 *                     example: "adidas"
 *                   name:
 *                     type: string
 *                     description: คำบางส่วนที่ปรากฏในชื่อสินค้า
 *                     example: "supernova"
 *                   price:
 *                     type: number
 *                     description: ราคา (จะค้นหาสินค้าที่ราคา *น้อยกว่าหรือเท่ากับ* ค่านี้)
 *                     example: 5000
 *     responses:
 *       200:
 *         description: ค้นหาสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ค้นหาสินค้าสำเร็จ"
 *                 total_found:
 *                   type: integer
 *                   description: จำนวนสินค้าที่ค้นพบ
 *                   example: 1
 *                 products:
 *                   type: array
 *                   description: รายการสินค้าที่ผ่านเงื่อนไข
 *                   items:
 *                     type: object
 *                     properties:
 *                       productid:
 *                         type: string
 *                         example: "PRD-001"
 *                       productname:
 *                         type: string
 *                         example: "Adidas Supernova Rise 2"
 *                       productbrand:
 *                         type: string
 *                         example: "Adidas"
 *                       price:
 *                         type: number
 *                         example: 4500
 *       500:
 *         description: เกิดข้อผิดพลาดฝั่งเซิร์ฟเวอร์
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า"
 */
router.post('/filter-products', getProductWithFilter);

/**
 * @swagger
 * /api/products/add-product:
 *   post:
 *     summary: เพิ่มสินค้าใหม่
 *     description: เพิ่มสินค้าใหม่พร้อมอัปโหลดรูปภาพ (เฉพาะ Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - productName
 *               - productDescription
 *               - productbrand
 *               - price
 *               - stock
 *               - productImage
 *             properties:
 *               productName:
 *                 type: string
 *                 example: "iPhone 15 Pro"
 *               productDescription:
 *                 type: string
 *                 example: "สมาร์ทโฟนรุ่นใหม่ล่าสุด"
 *               productbrand:
 *                 type: string
 *                 example: "Apple"
 *               price:
 *                 type: number
 *                 example: 39900
 *               stock:
 *                 type: integer
 *                 example: 10
 *               productImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: เพิ่มสินค้าและอัปโหลดรูปภาพสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เพิ่มสินค้าและอัปโหลดรูปภาพสำเร็จ"
 *                 product:
 *                   type: object
 *                 imageUrl:
 *                   type: string
 *                   example: "/uploads/productimage-171024xxx.jpg"
 *       400:
 *         description: ข้อมูลไม่ถูกต้อง หรือไม่ได้อัปโหลดรูปภาพ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "กรุณาอัปโหลดรูปภาพสินค้า"
 *       401:
 *         description: ไม่ได้รับอนุญาต
 *       500:
 *         description: เกิดข้อผิดพลาดในการเพิ่มสินค้า
 */
router.post('/add-product', upload.single('productImage'), addProduct);

/**
 * @swagger
 * /api/products/update-product/{productid}:
 *   put:
 *     summary: อัปเดตข้อมูลสินค้า
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสสินค้าที่ต้องการแก้ไข
 *         example: "Prd1a2b3c4d"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productName:
 *                 type: string
 *                 description: ชื่อสินค้าใหม่
 *                 example: "Nike Air Max 2024"
 *               productDescription:
 *                 type: string
 *                 description: รายละเอียดสินค้าใหม่
 *                 example: "รองเท้าวิ่งรุ่นใหม่ น้ำหนักเบากว่าเดิม"
 *               productImage:
 *                 type: string
 *                 description: URL รูปภาพสินค้าใหม่
 *                 example: "https://example.com/new-image.jpg"
 *               price:
 *                 type: number
 *                 description: ราคาสินค้าใหม่
 *                 example: 3200
 *               stock:
 *                 type: integer
 *                 description: จำนวนสินค้าในสต็อกใหม่
 *                 example: 20
 *     responses:
 *       200:
 *         description: อัปเดตข้อมูลสินค้าสำเร็จ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "อัปเดตข้อมูลสินค้าสำเร็จ"
 *                 product:
 *                   type: object
 *       404:
 *         description: ไม่พบสินค้าที่ต้องการแก้ไข
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบสินค้าที่ต้องการแก้ไข"
 *       500:
 *         description: เกิดข้อผิดพลาดในการอัปเดตสินค้า
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "เกิดข้อผิดพลาดในการอัปเดตสินค้า"
 */
router.put('/update-product/:productid', upload.single('productImage'), updateProduct);

/**
 * @swagger
 * /api/products/{productid}:
 *   delete:
 *     summary: ลบสินค้า
 *     description: ลบสินค้าออกจากระบบ หากสินค้าไม่มีการใช้งานในตะกร้าหรือคำสั่งซื้อ
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productid
 *         required: true
 *         schema:
 *           type: string
 *         description: รหัสสินค้าที่ต้องการลบ
 *         example: "Prd1a2b3c4d"
 *     responses:
 *       200:
 *         description: ลบสินค้าเรียบร้อยแล้ว
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ลบสินค้าเรียบร้อยแล้ว"
 *       400:
 *         description: ไม่สามารถลบสินค้าได้เนื่องจากมีการใช้งานอยู่ในระบบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่สามารถลบสินค้าได้ เนื่องจากมีการใช้งานอยู่ในระบบ"
 *       404:
 *         description: ไม่พบสินค้าที่ต้องการลบ
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "ไม่พบสินค้าที่ต้องการลบ"
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
router.delete('/delete-product/:productid', deleteProduct);

export default router;