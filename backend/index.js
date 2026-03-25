import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import aiRoutes from './src/routes/ai.js';
import graphRoutes from './src/routes/graph.js';
import schemaRoutes from './src/routes/schema.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use('/ai', aiRoutes);
app.use('/graph', graphRoutes);
app.use('/schema', schemaRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
