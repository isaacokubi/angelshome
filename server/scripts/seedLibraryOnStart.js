require("dotenv").config();
const mongoose = require("mongoose");
const LibraryBook = require("../models/LibraryBook");

const books = [
  { title: "Mathematics for Primary Schools", author: "School Mathematics Department", category: "Mathematics", subject: "Mathematics", publisher: "Angels Home Education Centre", year: 2026, location: "A-01", description: "Core mathematics reference for primary learners.", totalCopies: 5 },
  { title: "English Language Skills", author: "School English Department", category: "Languages", subject: "English", publisher: "Angels Home Education Centre", year: 2026, location: "A-02", description: "Reading, writing, grammar and communication practice.", totalCopies: 5 },
  { title: "Integrated Science", author: "School Science Department", category: "Science", subject: "Science", publisher: "Angels Home Education Centre", year: 2026, location: "A-03", description: "Foundational science learning resource.", totalCopies: 4 },
  { title: "Social Studies and Citizenship", author: "School Humanities Department", category: "Social Studies", subject: "Social Studies", publisher: "Angels Home Education Centre", year: 2026, location: "A-04", description: "Community, citizenship and social studies reference.", totalCopies: 4 },
  { title: "Computer Studies", author: "School ICT Department", category: "Technology", subject: "ICT", publisher: "Angels Home Education Centre", year: 2026, location: "A-05", description: "Introduction to digital literacy and computer studies.", totalCopies: 3 }
];

(async () => {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) { console.warn("Library startup seed skipped: MongoDB URI is not configured."); return; }
  try {
    await mongoose.connect(uri);
    let created = 0;
    for (const book of books) {
      const exists = await LibraryBook.exists({ title: book.title });
      if (!exists) {
        await LibraryBook.create({ ...book, availableCopies: book.totalCopies, isActive: true });
        created += 1;
      }
    }
    console.log(`Library startup check complete: ${created} new titles.`);
  } catch (error) {
    console.warn(`Library startup seed skipped: ${error.message}`);
  } finally {
    try { await mongoose.disconnect(); } catch {}
  }
})();
