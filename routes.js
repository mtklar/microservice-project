const express = require("express");
const csrf = require("csurf");
const { check, validationResult } = require("express-validator");
const fetch = require("node-fetch");

const db = require("./db/models");

const router = express.Router();

const csrfProtection = csrf({ cookie: true });

const asyncHandler = (handler) => (req, res, next) =>
  handler(req, res, next).catch(next);

router.get(
  "/",
  asyncHandler(async (req, res) => {
    const books = await db.Book.findAll({ order: [["title", "ASC"]] });
    res.render("book-list", { title: "Books", books });
  })
);

router.get("/book/add", csrfProtection, (req, res) => {
  const book = db.Book.build();
  res.render("book-add", {
    title: "Add Book",
    book,
    csrfToken: req.csrfToken(),
  });
});

const bookValidators = [
  check("title")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for Title")
    .isLength({ max: 255 })
    .withMessage("Title must not be more than 255 characters long"),
  check("author")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for Author")
    .isLength({ max: 100 })
    .withMessage("Author must not be more than 100 characters long"),
  check("releaseDate")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for Release Date")
    .isISO8601()
    .withMessage("Please provide a valid date for Release Date"),
  check("pageCount")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for Page Count")
    .isInt({ min: 0 })
    .withMessage("Please provide a valid integer for Page Count"),
  check("publisher")
    .exists({ checkFalsy: true })
    .withMessage("Please provide a value for Publisher")
    .isLength({ max: 100 })
    .withMessage("Publisher must not be more than 100 characters long"),
];

router.post(
  "/book/add",
  csrfProtection,
  bookValidators,
  asyncHandler(async (req, res) => {
    const { title, author, releaseDate, pageCount, publisher } = req.body;

    const book = db.Book.build({
      title,
      author,
      releaseDate,
      pageCount,
      publisher,
    });

    const validatorErrors = validationResult(req);

    if (validatorErrors.isEmpty()) {
      await book.save();
      res.redirect("/");
    } else {
      const errors = validatorErrors.array().map((error) => error.msg);
      res.render("book-add", {
        title: "Add Book",
        book,
        errors,
        csrfToken: req.csrfToken(),
      });
    }
  })
);

router.get(
  "/book/edit/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const book = await db.Book.findByPk(bookId);
    res.render("book-edit", {
      title: "Edit Book",
      book,
      csrfToken: req.csrfToken(),
    });
  })
);

router.post(
  "/book/edit/:id(\\d+)",
  csrfProtection,
  bookValidators,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const bookToUpdate = await db.Book.findByPk(bookId);

    const { title, author, releaseDate, pageCount, publisher } = req.body;

    const book = {
      title,
      author,
      releaseDate,
      pageCount,
      publisher,
    };

    const validatorErrors = validationResult(req);

    if (validatorErrors.isEmpty()) {
      await bookToUpdate.update(book);
      res.redirect("/");
    } else {
      const errors = validatorErrors.array().map((error) => error.msg);
      res.render("book-edit", {
        title: "Edit Book",
        book: { ...book, bookId },
        errors,
        csrfToken: req.csrfToken(),
      });
    }
  })
);

router.get(
  "/book/delete/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const book = await db.Book.findByPk(bookId);
    res.render("book-delete", {
      title: "Delete Book",
      book,
      csrfToken: req.csrfToken(),
    });
  })
);

router.post(
  "/book/delete/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const book = await db.Book.findByPk(bookId);
    await book.destroy();
    res.redirect("/");
  })
);

// TODO
router.get(
  "/book/details/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    let book = await db.Book.findByPk(bookId);

    // To request the flask app on the same network by name
    // fetch(`http://flask-api:5000/ratings/${bookId}`)
    // To request the flask app on the host machine (not docker)
    fetch(`http://host.docker.internal:5000/ratings/${bookId}`)
      .then((response) => response.json())
      .then((data) => {
        res.render("book-details", {
          title: "Book details",
          rating: data.average,
          book,
          csrfToken: req.csrfToken(),
        });
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  })
);

router.get(
  "/book/rate/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);
    const book = await db.Book.findByPk(bookId);

    res.render("book-rate", {
      title: "Rate Book",
      book,
      csrfToken: req.csrfToken(),
    });
  })
);

router.post(
  "/book/rate/:id(\\d+)",
  csrfProtection,
  asyncHandler(async (req, res) => {
    const bookId = parseInt(req.params.id, 10);

    const { value, email } = req.body;

    fetch(
      //  To request the flask app on the same network by name
      // `http://flask-api:5000/ratings/${bookId}?value=${value}&email=${email}`,
      // To request the flask app on the host machine (not docker)
      `http://host.docker.internal:5000/ratings/${bookId}?value=${value}&email=${email}`,
      {
        method: "POST",
      }
    )
      .then((response) => response.json())
      .then((data) => {
        res.redirect(`/book/details/${bookId}`);
      })
      .catch((error) => {
        console.error("Error:", error);
      });
  })
);

module.exports = router;
