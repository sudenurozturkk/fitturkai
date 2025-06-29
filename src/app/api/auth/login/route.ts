import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const usersFile = path.join(process.cwd(), 'src/data/users.json');

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Boş alan kontrolü
    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: 'E-posta ve şifre alanları boş bırakılamaz',
        },
        { status: 400 }
      );
    }

    // E-posta formatı kontrolü
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Geçerli bir e-posta adresi giriniz',
        },
        { status: 400 }
      );
    }

    // users.json dosyasını dinamik olarak oku
    const fileData = await fs.readFile(usersFile, 'utf-8');
    const users = JSON.parse(fileData);
    const user = users.find((u: any) => u.email === email);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: 'Bu e-posta adresi ile kayıtlı kullanıcı bulunamadı',
        },
        { status: 401 }
      );
    }

    if (user.password !== password) {
      return NextResponse.json(
        {
          success: false,
          message: 'Şifre hatalı',
        },
        { status: 401 }
      );
    }

    // Giriş başarılı
    return NextResponse.json({
      success: true,
      message: 'Giriş başarılı',
      token: 'dummy-token',
      user: {
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Giriş yapılırken bir hata oluştu. Lütfen daha sonra tekrar deneyin.',
      },
      { status: 500 }
    );
  }
}
