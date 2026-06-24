db.books.updateMany({isbn: {$in: ['978-1204-30-2', '978-5692-65-1', '9780201633610', '9780132350884']}}, {$set: {available: false}});
