import bcrypt from 'bcryptjs';

async function main() {
  const hash = '$2a$10$82sqYHpPuJYQ/Y15Ux.zGeYCV7EhwxElRXdSSxe/Lifh/6qRUxt8y';
  const match = await bcrypt.compare('password123', hash);
  console.log('Bcrypt Match status for "password123":', match);
}

main().catch(console.error);
