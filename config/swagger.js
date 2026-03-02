// config/swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0', // ระบุเวอร์ชันของ OpenAPI
        info: {
            title: 'Shoe Shop API',
            version: '1.0.0',
            description: 'ระบบ API สำหรับร้านขายรองเท้า (Backend Shoe Shop)',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Development Server',
            },
        ],
        // ตั้งค่าให้ Swagger รู้ว่าเราใช้ระบบ Authentication ผ่าน Cookie ที่ชื่อว่า 'token'
        components: {
            securitySchemes: {
                cookieAuth: {
                    type: 'apiKey',
                    in: 'cookie',
                    name: 'token',
                },
            },
        },
    },
    // บอกให้ Swagger ไปไล่อ่านคอมเมนต์เอกสารจากไฟล์ในโฟลเดอร์ routes
    apis: ['./router/*.js'], 
};

export const swaggerSpec = swaggerJSDoc(options);