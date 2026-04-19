import express from 'express';
import cors from 'cors';

import clientRoutes from './routes/client.routes';
import menuItemRoutes from './routes/menuItem.routes';
import categoryRoutes from './routes/category.routes';
import orderRoutes from './routes/order.routes';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './swagger.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount route groups
app.use('/clients', clientRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/categories', categoryRoutes);
app.use('/orders', orderRoutes);

// Swagger UI setup
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

export default app;
