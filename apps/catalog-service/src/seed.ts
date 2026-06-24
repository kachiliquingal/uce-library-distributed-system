import mongoose from "mongoose";
import dotenv from "dotenv";
import { BookModel } from "./infrastructure/database/BookModel";

dotenv.config();

const FACULTIES = [
  "Arquitectura", "Artes", "Ciencias", "Ciencias Administrativas",
  "Ciencias Agrícolas", "Ciencias Biológicas", "Ciencias de la Discapacidad",
  "Ciencias Económicas", "Ciencias Médicas", "Ciencias Psicológicas",
  "Ciencias Químicas", "Comunicación Social", "Cultura Física",
  "Derecho y Ciencias Políticas", "Filosofía y Letras", "Ingeniería",
  "Ingeniería Química", "Medicina Veterinaria", "Odontología",
  "Ciencias Sociales", "Turismo y Hospitalidad"
];

const SUBJECTS = [
  "Introducción", "Avanzado", "Fundamentos", "Teoría", "Práctica",
  "Aplicaciones", "Manual", "Guía de", "Historia de", "Análisis de"
];

function generateRandomBook(index: number) {
  const faculty = FACULTIES[Math.floor(Math.random() * FACULTIES.length)];
  const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
  const year = Math.floor(Math.random() * (2024 - 1980 + 1)) + 1980;
  
  return {
    title: `${subject} ${faculty} Vol. ${index}`,
    author: `Dr. Autor Aleatorio ${index}`,
    isbn: `978-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 90) + 10}-${index}`,
    publishedYear: year,
    category: faculty,
    available: true
  };
}

async function runSeeder() {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://root:rootpassword@localhost:27017/catalog_db?authSource=admin";
    console.log(`Connecting to ${mongoUri}...`);
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB");

    console.log("Deleting existing generated books (if any to avoid duplicates)...");
    // Only delete books that match the pattern to keep existing important books like "Clean Code"
    await BookModel.deleteMany({ title: /Vol\./ });

    console.log("Generating 5000 books...");
    const books = [];
    for (let i = 1; i <= 5000; i++) {
      books.push(generateRandomBook(i));
    }

    console.log("Inserting into MongoDB (Bulk)...");
    await BookModel.insertMany(books);
    
    const count = await BookModel.countDocuments();
    console.log(`Success! Total books in DB: ${count}`);

  } catch (error) {
    console.error("Error seeding DB:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

runSeeder();
