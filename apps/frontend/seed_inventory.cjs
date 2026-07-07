const axios = require('axios');

const CATALOG_URL = 'http://32.199.97.153/api/catalog/books';
const INVENTORY_URL = 'http://32.199.97.153/api/inventory/';

async function seed() {
  try {
    console.log('Fetching catalog...');
    const catalogResponse = await axios.get(CATALOG_URL);
    const books = catalogResponse.data;
    console.log(`Found ${books.length} books in catalog.`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < books.length; i++) {
      const book = books[i];
      if (!book.category) {
        skippedCount++;
        continue;
      }
      
      try {
        await axios.post(INVENTORY_URL, {
          isbn: book.isbn,
          initialCopies: 1,
          shelfLocation: `Biblioteca - ${book.category}`
        });
        successCount++;
      } catch (err) {
        console.error(`\nError inserting ISBN ${book.isbn}:`, err.response?.data || err.message);
        process.exit(1);
      }

      if ((i + 1) % 50 === 0) {
        process.stdout.write(`\rProgress: ${i + 1}/${books.length} | Success: ${successCount} | Errors: ${errorCount} | Skipped: ${skippedCount}`);
      }
    }
    console.log(`\nSeeding completed! Success: ${successCount}, Errors: ${errorCount}, Skipped: ${skippedCount}`);
  } catch (err) {
    console.error('Failed to fetch catalog:', err.message);
  }
}

seed();
