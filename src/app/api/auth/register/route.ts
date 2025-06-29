import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const usersFile = path.join(process.cwd(), 'src/data/users.json');

export async function POST(request: Request) {
  try {
    const { name, email, password, age, gender } = await request.json();
    if (!name || !email || !password || !age || !gender) {
      return NextResponse.json(
        { success: false, message: 'Tüm alanlar zorunlu.' },
        { status: 400 }
      );
    }
    // Kullanıcıları oku
    const fileData = await fs.readFile(usersFile, 'utf-8');
    const users = JSON.parse(fileData);
    // E-posta benzersiz mi?
    const existing = users.find((u: any) => u.email === email);
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'Bu e-posta ile zaten kayıtlı bir kullanıcı var.' },
        { status: 409 }
      );
    }
    // Yeni kullanıcıyı ekle
    const newUser = { name, email, password, age, gender };
    users.push(newUser);
    await fs.writeFile(usersFile, JSON.stringify(users, null, 2), 'utf-8');
    return NextResponse.json({
      success: true,
      message: 'Kayıt başarılı!',
      user: { name, email, age, gender },
    });
  } catch (error) {
    console.error('Kayıt API hatası:', error);
    return NextResponse.json(
      { success: false, message: 'Kayıt sırasında bir hata oluştu.' },
      { status: 500 }
    );
  }
}
