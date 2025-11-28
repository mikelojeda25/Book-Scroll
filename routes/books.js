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

const Genre = require("../models/genre"); // 💡 IDAGDAG ITO SA ITAAS

// 💡 NEW/UPDATED HELPER FUNCTION
const renderNewPage = async (res, book, hasError = false) => {
  try {
    // 💡 KUNIN ANG LAHAT NG GENRES MULA SA DB
    const genres = await Genre.find({});

    const params = {
      book: book,
      genres: genres, // 💡 IPASA ANG GENRES DITO
    };

    if (hasError) {
      params.errorMessage = "Error creating Book. Please check fields.";
    }
    res.render("books/new", params);
  } catch (err) {
    console.error(err);
    res.redirect("/books");
  }
};

const renderEditPage = async (res, book, hasError = false) => {
  try {
    // 💡 KUNIN DIN ANG LAHAT NG GENRES PARA SA DROPDOWN
    const genres = await Genre.find({});

    const params = {
      book: book,
      genres: genres,
    };

    if (hasError) {
      params.errorMessage = "Error updating Book. Please check fields.";
    }
    res.render("books/edit", params);
  } catch (err) {
    console.error(err);
    res.redirect("/books");
  }
};

// 2. GET /books/new (New Book Form Route)
router.get("/new", async (req, res) => {
  // 💡 AWAIT ang helper function dahil async na ito
  await renderNewPage(res, new Book());
});

// ===================================================================
// 1. GET /books/ (Index Route - Displaying all books)
// ===================================================================

router.get("/", async (req, res) => {
  // 💡 1. Gumawa ng base query object
  let query = Book.find();

  const searchOptions = {
    title: req.query.title || "", // Fallback sa empty string
    sort: req.query.sort || "createdAt", // Default sort field: createdAt
    dir: req.query.dir || "desc", // Default direction: desc
  };

  // ===================================
  // 2. I-handle ang SEARCH (Filtering)
  // ===================================

  if (searchOptions.title !== "") {
    // Case-Insensitive Search gamit ang Regular Expression
    query = query.regex("title", new RegExp(searchOptions.title, "i"));
  }

  // ===================================
  // 3. I-handle ang SORTING
  // ===================================

  const sortOrder = {}; // E.g., { title: 'asc' }
  sortOrder[searchOptions.sort] = searchOptions.dir;
  query = query.sort(sortOrder); // I-apply ang sorting

  try {
    const books = await query.populate("genre").exec();

    // I-render ang view at ipasa ang books at ang searchOptions
    res.render("books/index", {
      books: books,
      searchOptions: searchOptions,
    });
  } catch (err) {
    console.error(err);
    // Kapag may error sa DB, mag-render ng empty array at walang search options
    res.render("books/index", { books: [], searchOptions: {} });
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
    overview: req.body.overview,
    genre: req.body.genre, // Ito ang Genre ID mula sa dropdown
    author: req.body.author,
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

    book.overview = req.body.overview;
    book.genre = req.body.genre;
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
    const book = await Book.findById(req.params.id).populate("genre").exec();
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
