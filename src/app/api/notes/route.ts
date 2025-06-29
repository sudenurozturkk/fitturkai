import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/notes.json');

function readNotes() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeNotes(notes) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(notes, null, 2));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  let notes = readNotes();
  if (userId) notes = notes.filter((n) => n.userId === userId);
  return NextResponse.json(notes);
}

export async function POST(request) {
  const body = await request.json();
  const notes = readNotes();
  const newNote = { ...body, _id: Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
  notes.push(newNote);
  writeNotes(notes);
  return NextResponse.json(newNote);
}

export async function PUT(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const body = await request.json();
  const notes = readNotes();
  const idx = notes.findIndex((n) => n._id === id);
  if (idx !== -1) {
    notes[idx] = { ...notes[idx], ...body, updatedAt: new Date() };
    writeNotes(notes);
    return NextResponse.json(notes[idx]);
  } else {
    const newNote = { ...body, _id: id || Date.now().toString(), createdAt: new Date(), updatedAt: new Date() };
    notes.push(newNote);
    writeNotes(notes);
    return NextResponse.json(newNote);
  }
}

export async function DELETE(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  let notes = readNotes();
  const before = notes.length;
  notes = notes.filter((n) => n._id !== id);
  writeNotes(notes);
  if (notes.length === before) {
    return NextResponse.json({ error: 'Not bulunamadı veya silinemedi' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
