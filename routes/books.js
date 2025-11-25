// routes/books.js (FINAL VERSION)

const express = require("express");
const router = express.Router();
const Book = require("../models/book");

// Function para ma-reuse natin ang code ng form rendering
const renderNewPage = (res, book, hasError = false) => {
  try {
    const params = { book: book };
    if (hasError) {
      params.errorMessage = "Error creating Book";
    }
    res.render("books/new", params);
  } catch {
    res.redirect("/books");
  }
};

// 1. GET /books/new (New Book Form Route)------------------------------------------
router.get("/new", (req, res) => {
  // 💡 Gumagawa ng BLANKONG Book object para sa form
  renderNewPage(res, new Book());
});

// 2. POST /books/ (Create Book Route)----------------------------------------------
router.post("/", async (req, res) => {
  const book = new Book({
    title: req.body.title,
  });

  try {
    const newBook = await book.save();
    res.redirect("/"); // ⬅️ Redirect sa Home Page kapag success
  } catch (err) {
    // Kapag may error, i-render ulit ang form kasama ang error message
    renderNewPage(res, book, true);
  }
});

// 3. GET /books/ (Index Route - Displaying all books)-----------------------------
router.get("/", async (req, res) => {
  let books;
  try {
    // 💡 Mongoose command: Kunin lahat ng books sa database
    // Ang .exec() ay optional pero maganda para ma-standardize ang async
    books = await Book.find().exec();

    // I-render ang view at ipasa ang books
    res.render("books/index", {
      books: books, // Ipinapasa ang array ng books
    });
  } catch {
    // Kapag may error sa DB, mag-render na lang ng empty array
    books = [];
    res.render("books/index", {
      books: books,
    });
  }
});

// 4. GET /books/:id (Show Book Details Route)
router.get("/:id", async (req, res) => {
  try {
    // 💡 Mongoose: Kunin ang isang Book gamit ang ID galing sa URL
    const book = await Book.findById(req.params.id).exec();

    // I-render ang view at ipasa ang isang Book object
    res.render("books/show", { book: book });
  } catch {
    // Kung hindi makita ang ID (404) o may DB error, bumalik sa Index
    res.redirect("/books");
  }
});

module.exports = router;
