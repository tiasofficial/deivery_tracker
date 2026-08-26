import { prisma } from '../config/prisma';
import bcrypt from 'bcryptjs';
import { generateToken } from '../utils/jwt';

export const register = async (data: any) => {
  const { name, phone, password, role, vehicleNo, vendorCode } = data;
  const email = data.email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new Error('Email already in use');

  const hashedPassword = await bcrypt.hash(password, 10);
  let vendorId = null;

  if (role === 'DRIVER') {
    if (!vendorCode) throw new Error('Driver must have a vendorCode');
    const vendor = await prisma.user.findFirst({
      where: { OR: [{ id: vendorCode }, { email: vendorCode.trim().toLowerCase() }], role: 'VENDOR' },
    });
    if (!vendor) throw new Error('Invalid vendorCode');
    vendorId = vendor.id;
  }

  const user = await prisma.user.create({
    data: { name, email, phone, password: hashedPassword, role, vehicleNo, vendorId },
  });

  const token = generateToken({ id: user.id, role: user.role });
  return { user: { id: user.id, name, email, role, vendorId: user.vendorId }, token };
};

export const login = async (data: any) => {
  console.log('Login data received:', JSON.stringify(data));
  const email = data.email.trim().toLowerCase();
  const { password } = data;
  
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    console.log('User not found in DB for email:', email);
    throw new Error('Invalid credentials');
  }

  const isValid = await bcrypt.compare(password, user.password);
  console.log('Password valid comparison result:', isValid);
  if (!isValid) throw new Error('Invalid credentials');

  const token = generateToken({ id: user.id, role: user.role });
  return { user: { id: user.id, name: user.name, email, role: user.role, vendorId: user.vendorId }, token };
};

export const getMe = async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true, role: true, vehicleNo: true, vendorId: true },
  });
};
