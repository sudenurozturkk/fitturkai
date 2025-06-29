import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/goals.json');

function readGoals() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeGoals(goals) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(goals, null, 2));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const type = searchParams.get('type');
  let goals = readGoals();
  if (userId) goals = goals.filter((g) => g.userId === userId);
  if (type) goals = goals.filter((g) => g.type === type);
  goals = goals.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  return NextResponse.json(goals);
}

export async function POST(request) {
  const body = await request.json();
  const goals = readGoals();
  const newGoal = { ...body, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
  goals.push(newGoal);
  writeGoals(goals);
  return NextResponse.json(newGoal);
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  const goals = readGoals();
  const idx = goals.findIndex((g) => g._id === id);
  if (idx !== -1) {
    goals[idx] = { ...goals[idx], ...body, updatedAt: new Date() };
    writeGoals(goals);
    return NextResponse.json(goals[idx]);
  } else {
    // Eğer yoksa yeni ekle
    const newGoal = { ...body, _id: id || Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
    goals.push(newGoal);
    writeGoals(goals);
    return NextResponse.json(newGoal);
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let goals = readGoals();
  const before = goals.length;
  goals = goals.filter((g) => g._id !== id);
  writeGoals(goals);
  if (goals.length === before) {
    return NextResponse.json({ error: 'Hedef bulunamadı veya silinemedi' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
