import 'dotenv/config';
import { app } from './app';
import { sequelize } from './database/sequelize';

const port = Number(process.env.PORT ?? 3000);

async function start(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established');
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }

  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

start();
