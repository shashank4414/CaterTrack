import express from 'express';

import clientRoutes from './routes/clients.routes';
import menuItemRoutes from './routes/menuItems.routes';
import categoryRoutes from './routes/categories.routes';
import orderRoutes from './routes/orders.routes';

const app = express();

app.use(express.json());

// Mount route groups
app.use('/clients', clientRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/categories', categoryRoutes);
app.use('/orders', orderRoutes);

export default app;
