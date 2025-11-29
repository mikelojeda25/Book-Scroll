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

const Genre = require("../models/genre");

// 💡 NEW/UPDATED HELPER FUNCTION
const renderNewPage = async (res, book, hasError = false) => {
  try {
    const genres = await Genre.find({});

    const params = {
      book: book,
      genres: genres,
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
  await renderNewPage(res, new Book());
});

// ===================================================================
// 1. GET /books/ (Index Route - Displaying all books)
// ===================================================================

router.get("/", async (req, res) => {
  // 💡 1. Gumawa ng base query object
  let query = Book.find();

  const perPage = 10; // 🔑 Ilang books per page
  const page = parseInt(req.query.page) || 1; // 🔑 Current page (Default is 1)

  const searchOptions = {
    title: req.query.title || "",
    sort: req.query.sort || "createdAt",
    dir: req.query.dir || "desc",
  };

  // ===================================
  // 2. SEARCH (Filtering)
  // ===================================
  if (searchOptions.title !== "") {
    query = query.regex("title", new RegExp(searchOptions.title, "i"));
  }

  // ===================================
  // 3. SORTING
  // ===================================
  const sortOrder = {};
  sortOrder[searchOptions.sort] = searchOptions.dir;
  query = query.sort(sortOrder);

  // ===================================
  // 4. PAGINATION EXECUTION
  // ===================================
  try {
    const count = await Book.countDocuments(query.getFilter());
    const totalPages = Math.ceil(count / perPage);

    // 🔑 I-apply ang pagination (SKIP at LIMIT)
    const books = await query
      .populate("genre")
      .limit(perPage)
      .skip((page - 1) * perPage)
      .exec();

    res.render("books/index", {
      books: books,
      searchOptions: searchOptions,
      // 🔑 PAGINATION DATA
      currentPage: page,
      totalPages: totalPages,
      perPage: perPage,
      totalBooks: count,
    });
  } catch (err) {
    console.error(err);
    res.render("books/index", { books: [], searchOptions: {} });
  }
});
// ===================================================================
// 2. GET /books/new (New Book Form Route)
// ===================================================================

router.get("/new", (req, res) => {
  renderNewPage(res, new Book());
});

// ===================================================================
// 3. POST /books/ (Create Book Route)
// ===================================================================

router.post("/", upload.single("cover"), async (req, res) => {
  const publishedDate = req.body.publishDate
    ? new Date(req.body.publishDate)
    : new Date();

  const newBook = new Book({
    title: req.body.title,
    publishDate: publishedDate,
    overview: req.body.overview,
    genre: req.body.genre,
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
// 5. PUT /books/:id (Update Book Route)
// ===================================================================

router.put("/:id", upload.single("cover"), async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);

    book.title = req.body.title;

    book.overview = req.body.overview;
    book.genre = req.body.genre;
    book.publishDate = new Date(req.body.publishDate);

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
// 6. DELETE /books/:id (Delete Book Route)
// ===================================================================

router.delete("/:id", async (req, res) => {
  let book;
  try {
    book = await Book.findById(req.params.id);
    await book.deleteOne();
    res.redirect("/books");
  } catch (err) {
    if (book == null) {
      res.redirect("/");
    } else {
      res.redirect(`/books/${book.id}`);
    }
  }
});
// ===================================================================
// 7. GET /books/:id (Show Book Details Route)
// ===================================================================

router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id)
      .populate("author")
      .populate("genre")
      .select("+coverImage +coverImageType")
      .exec();

    res.render("books/show", { book: book });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

module.exports = router;
