import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './router/userRoutes.js';
import cartRoutes from './router/cartRoutes.js';
import productRoutes from './router/productRoutes.js';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger.js';

dotenv.config()

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', // ปรับเป็น URL ของ frontend ของคุณ
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/products', productRoutes);
// ทดสอบ Route พื้นฐาน
app.get('/', (req, res) => {
  res.send('Shop Shoe comming soon!');
});

const PORT = process.env.PORT ;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});