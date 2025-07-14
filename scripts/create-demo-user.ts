import bcrypt from 'bcrypt';
import fs from 'fs/promises';
import path from 'path';

async function createDemoUser() {
  const password = 'demo123';
  const passwordHash = await bcrypt.hash(password, 10);
  
  const users = [
    {
      id: 1,
      username: 'demo',
      passwordHash,
      createdAt: new Date().toISOString()
    }
  ];
  
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  
  const usersFile = path.join(dataDir, 'users.json');
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2));
  
  console.log('Demo user created successfully!');
  console.log('Username: demo');
  console.log('Password: demo123');
}

createDemoUser().catch(console.error);