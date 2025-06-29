import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

interface Recipe {
  _id: string;
  userId: string;
  title: string;
  description: string;
  category: string[];
  image: string;
  ingredients: string[];
  steps: string[];
  createdAt: Date;
  updatedAt: Date;
}

const DATA_PATH = path.join(process.cwd(), 'src/data/recipes.json');

function readRecipes(): Recipe[] {
  if (!fs.existsSync(DATA_PATH)) return [];
  return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
}

function writeRecipes(recipes: Recipe[]): void {
  fs.writeFileSync(DATA_PATH, JSON.stringify(recipes, null, 2));
}

// Tarifleri getir
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let recipes = readRecipes();
    if (userId) {
      recipes = recipes.filter((r: Recipe) => r.userId === userId);
    }
    
    // Tarifleri oluşturulma tarihine göre sırala (en yeniden en eskiye)
    recipes.sort((a: Recipe, b: Recipe) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return NextResponse.json(recipes);
  } catch (error) {
    console.error('Tarifler alınırken hata oluştu:', error);
    return NextResponse.json({ error: 'Tarifler alınamadı' }, { status: 500 });
  }
}

// Yeni tarif ekle
export async function POST(request: Request) {
  try {
    const recipe = await request.json();
    const recipes = readRecipes();
    
    const newRecipe: Recipe = {
      ...recipe,
      _id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Yeni tarifi en başa ekle
    recipes.unshift(newRecipe);
    writeRecipes(recipes);
    
    return NextResponse.json(newRecipe);
  } catch (error) {
    console.error('Tarif eklenirken hata oluştu:', error);
    return NextResponse.json({ error: 'Tarif eklenemedi' }, { status: 500 });
  }
}

// Tarif güncelle
export async function PUT(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Tarif ID\'si gerekli' }, { status: 400 });
    }
    
    const recipe = await request.json();
    const recipes = readRecipes();
    const index = recipes.findIndex((r: Recipe) => r._id === id);
    
    if (index === -1) {
      return NextResponse.json({ error: 'Tarif bulunamadı' }, { status: 404 });
    }
    
    recipes[index] = {
      ...recipes[index],
      ...recipe,
      updatedAt: new Date()
    };
    
    writeRecipes(recipes);
    return NextResponse.json(recipes[index]);
  } catch (error) {
    console.error('Tarif güncellenirken hata oluştu:', error);
    return NextResponse.json({ error: 'Tarif güncellenemedi' }, { status: 500 });
  }
}

// Tarif sil
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Tarif ID\'si gerekli' }, { status: 400 });
    }
    
    const recipes = readRecipes();
    const filteredRecipes = recipes.filter((r: Recipe) => r._id !== id);
    
    if (filteredRecipes.length === recipes.length) {
      return NextResponse.json({ error: 'Tarif bulunamadı' }, { status: 404 });
    }
    
    writeRecipes(filteredRecipes);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Tarif silinirken hata oluştu:', error);
    return NextResponse.json({ error: 'Tarif silinemedi' }, { status: 500 });
  }
}
