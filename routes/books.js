// routes/books.js (FINAL VERSION)

const express = require("express");
const router = express.Router();
const Book = require("../models/book");

// Function para ma-reuse natin ang code ng form rendering
const renderNewPage = (res, book, hasError = false) => {
  // Note: Ginagamit natin ang 'try...catch' dito dahil ang res.render ay puwedeng mag-crash
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

// 1. GET /books/new (New Book Form Route)
router.get("/new", (req, res) => {
  // 💡 Gumagawa ng BLANKONG Book object para sa form
  renderNewPage(res, new Book());
});

// 2. POST /books/ (Create Book Route)
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

// 3. GET /books/ (Index Route - Existing code mo)
router.get("/", (req, res) => {
  res.send("Hello from Book index");
});

module.exports = router;
