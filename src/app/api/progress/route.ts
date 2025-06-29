import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/progress.json');

function readProgress() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeProgress(progress) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(progress, null, 2));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  let progress = readProgress();
  if (userId) progress = progress.filter((p) => p.userId === userId);
  progress = progress.sort((a, b) => new Date(b.date) - new Date(a.date));
  return NextResponse.json(progress);
}

export async function POST(request) {
  const body = await request.json();
  const progress = readProgress();
  const newProgress = { ...body, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
  progress.push(newProgress);
  writeProgress(progress);
  return NextResponse.json(newProgress);
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  const progress = readProgress();
  const idx = progress.findIndex((p) => p._id === id);
  if (idx !== -1) {
    progress[idx] = { ...progress[idx], ...body, updatedAt: new Date() };
    writeProgress(progress);
    return NextResponse.json(progress[idx]);
  } else {
    const newProgress = { ...body, _id: id || Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
    progress.push(newProgress);
    writeProgress(progress);
    return NextResponse.json(newProgress);
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let progress = readProgress();
  const before = progress.length;
  progress = progress.filter((p) => p._id !== id);
  writeProgress(progress);
  if (progress.length === before) {
    return NextResponse.json({ error: 'Kayıt bulunamadı veya silinemedi' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
