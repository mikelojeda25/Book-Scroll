// routes/books.js (FINAL VERSION)

const express = require("express");
const router = express.Router();
const Book = require("../models/book");
const multer = require("multer");

// ===================================================================
// 💡 MULTER SETUP (Para sa Image Upload)
// ===================================================================

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (file.mimetype.startsWith("image/")) {
      callback(null, true);
    } else {
      // Maaari mong i-set ang isang error message dito
      callback(null, false);
    }
  },
});

// ===================================================================
// 💡 HELPER FUNCTIONS (Para sa Reusable Code)
// ===================================================================

const renderNewPage = (res, book, hasError = false) => {
  try {
    const params = { book: book };
    if (hasError) {
      params.errorMessage = "Error creating Book. Please check fields.";
    }
    res.render("books/new", params);
  } catch {
    // Kung may error sa EJS rendering, pumunta na lang sa Index
    res.redirect("/books");
  }
};

const renderEditPage = (res, book, hasError = false) => {
  try {
    const params = { book: book };
    if (hasError) {
      params.errorMessage = "Error updating Book. Please check fields.";
    }
    res.render("books/edit", params);
  } catch {
    res.redirect("/books");
  }
};

// ===================================================================
// 1. GET /books/ (Index Route - Displaying all books)
// ===================================================================

router.get("/", async (req, res) => {
  try {
    const books = await Book.find().exec();
    res.render("books/index", { books: books });
  } catch {
    // Kapag may error sa DB, mag-render na lang ng empty array
    res.render("books/index", { books: [] });
  }
});

// ===================================================================
// 2. GET /books/new (New Book Form Route)
// ===================================================================

router.get("/new", (req, res) => {
  // 💡 Gumagawa ng BLANKONG Book object para sa form
  renderNewPage(res, new Book());
});

// ===================================================================
// 3. POST /books/ (Create Book Route)
// ===================================================================

router.post("/", upload.single("cover"), async (req, res) => {
  // 💡 Tiyakin na may fallback value para sa date
  const publishedDate = req.body.publishDate
    ? new Date(req.body.publishDate)
    : new Date();

  const newBook = new Book({
    title: req.body.title,
    publishDate: publishedDate,
  });

  // 💡 Cover Image Handling
  if (req.file != null) {
    newBook.coverImage = req.file.buffer;
    newBook.coverImageType = req.file.mimetype;
  }

  try {
    const book = await newBook.save();
    res.redirect(`/books/${book.id}`); // Success: Redirect sa Show Page
  } catch (err) {
    console.error(err);
    // Kapag may error sa DB validation, i-render ulit ang form kasama ang data
    renderNewPage(res, newBook, true);
  }
});

// ===================================================================
// 4. GET /books/:id/edit (Edit Book Form Route)
// ===================================================================

router.get("/:id/edit", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (book == null) return res.redirect("/books");
    renderEditPage(res, book);
  } catch {
    res.redirect("/books");
  }
});
// ===================================================================
// 6. PUT /books/:id (Update Book Route)
// ===================================================================

router.put("/:id", upload.single("cover"), async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);

    book.title = req.body.title;
    book.publishDate = new Date(req.body.publishDate);

    // 💡 I-handle ang bagong cover image (optional sa update)
    if (req.file != null) {
      book.coverImage = req.file.buffer;
      book.coverImageType = req.file.mimetype;
    }

    await book.save();
    res.redirect(`/books/${book.id}`);
  } catch (err) {
    if (book == null) {
      res.redirect("/");
    } else {
      renderEditPage(res, book, true);
    }
  }
});

// ===================================================================
// 7. DELETE /books/:id (Delete Book Route)
// ===================================================================

router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.deleteOne();
    // 💡 Redirect sa Index Page (All Books)
    res.redirect("/books");
  } catch (err) {
    if (book == null) {
      res.redirect("/");
    } else {
      // Kung may error, bumalik sa Show Page
      res.redirect(`/books/${book.id}`);
    }
  }
});
// ===================================================================
// 5. GET /books/:id (Show Book Details Route)
// ===================================================================

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id).exec();
    // 💡 Safety Check: Kung deleted na
    if (book == null) {
      return res.redirect("/books");
    }
    res.render("books/show", { book: book });
  } catch {
    res.redirect("/books");
  }
});

module.exports = router;
