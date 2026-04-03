import express from 'express';
import clientRoutes from './routes/client.routes';
import categoryRoutes from './routes/category.routes';
import menuItemRoutes from './routes/menuItem.routes';
import orderRoutes from './routes/order.routes';
import orderItemRoutes from './routes/orderItem.routes';

const app = express();
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('Catering API is running');
});

// Register routes
app.use('/clients', clientRoutes);
app.use('/categories', categoryRoutes);
app.use('/menu-items', menuItemRoutes);
app.use('/orders', orderRoutes);
app.use('/order-items', orderItemRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
