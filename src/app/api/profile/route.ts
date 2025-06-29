import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DATA_PATH = path.join(process.cwd(), 'src/data/profiles.json');

function readProfiles() {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeProfiles(profiles) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(profiles, null, 2));
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  const profiles = readProfiles();
  let profile = profiles.find((p) => p.userId === userId);
  if (!profile) {
    profile = {
      userId,
      personalInfo: { name: "", age: 0, gender: "", height: 0, weight: 0, activityLevel: "moderate" },
      healthInfo: { allergies: [], conditions: [], medications: [], bloodType: "" },
      preferences: { dietaryRestrictions: [], fitnessGoals: [], mealPreferences: [], workoutPreferences: [] },
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }
  return NextResponse.json(profile);
}

export async function POST(request) {
  const body = await request.json();
  const profiles = readProfiles();
  profiles.push({ ...body, createdAt: new Date(), updatedAt: new Date() });
  writeProfiles(profiles);
  return NextResponse.json(body);
}

export async function PUT(request) {
  const body = await request.json();
  const profiles = readProfiles();
  const idx = profiles.findIndex((p) => p.userId === body.userId);
  if (idx !== -1) {
    profiles[idx] = { ...profiles[idx], ...body, updatedAt: new Date() };
  } else {
    profiles.push({ ...body, createdAt: new Date(), updatedAt: new Date() });
  }
  writeProfiles(profiles);
  return NextResponse.json(body);
}
