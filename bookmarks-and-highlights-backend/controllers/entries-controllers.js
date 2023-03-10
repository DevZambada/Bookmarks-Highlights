const HttpError = require("../models/http-error");
const { v4: uuidv4 } = require('uuid');
let { entries } = require("../MOCKDATA");
const { validationResult } = require("express-validator");
const Entry = require("../models/entry");

const createBook = function (req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {throw new HttpError("Invalid input, please check your data", 422);}
  const { bookTitle } = req.body;

  const newBook = {
    bookTitle,
    bookId: uuidv4()
  };
  res.json(newBook);
};

const createEntry = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {throw new HttpError("Invalid inputs, please check your data", 422);}
  const { bookTitle, bookId, photoUrl, tags, date, pageNumber } = req.body;
  const selectedUserId = req.params.userid;
  const newEntry = new Entry({
    userId: selectedUserId,
    bookTitle,
    bookId,
    photoUrl,
    tags,
    date,
    pageNumber
  });

  try {
    await newEntry.save();
  } catch (err) {
    const error = new HttpError("Could not add entry to database!", 500);
    return next(error);
  }

  res.status(201).json({entry: newEntry});
};

const deleteEntry = async (req, res, next) => {
  const selectedItemId = req.params.itemId;

  let selectedEntry;
  try {
    selectedEntry = await Entry.findByIdAndDelete(selectedItemId)
  } catch (err) {
    const error = new HttpError("Sorry, could not find the specified entry!", 500);
    return next (error);
  }

  res.status(200).json({message: "Successfully deleted this item."});
};

const getEntryByItemId = async (req, res, next) => {
  const itemId = req.params.itemId;

  let selectedEntry;
  try {
    selectedEntry = await Entry.findById(itemId);
  } catch (err) {
    const error = new HttpError("Could not find specified entry!", 500);
    return next(error);
  }
  
  if (!selectedEntry) {
    const error = new HttpError("Sorry, we could not find an entry with that information", 404);
    return next(error);
  }

  res.json({ selectedEntry: selectedEntry.toObject({ getters: true }) });
};

const getUserBooks = async (req, res, next) => {
  const userid = req.params.userid;
  
  let userEntries;
  try {
    userEntries = await Entry.find({ userId: userid }).exec();
  } catch (err) {
    const error = new HttpError("Could not find entries!", 500);
    return next(error);
  }

  const userBooks = userEntries.map(({ bookTitle, bookId }) => ({ bookTitle, bookId }));
  const unique = []
  const userBooksNoDuplicates = userBooks.filter(book => {
    const isDuplicate = unique.includes(book.bookTitle);
    if (!isDuplicate) {
      unique.push(book.bookTitle);
      return true
    };
    return false;
  });
  res.json({ userBooksNoDuplicates: userBooksNoDuplicates.map(book => book.toObject({ getters: true })) });
};

const getUserEntriesByUserId = async (req, res, next) => {
  const userid = req.params.userid;

  let userEntries;
  try {
    userEntries = await Entry.find({ userId: userid }).exec();
  } catch (err) {
    const error = new HttpError("Sorry, we could not find the entries!", 500);
    return next(error);
  }
  
  if (!userEntries || userEntries.length === 0) {
    const error = new HttpError("Sorry, we could not find the entries!", 404);
    return next(error);
  }

  res.json({ userEntries: userEntries.map(userEntry => userEntry.toObject({ getters: true })) });
};

const updateEntry = async (req, res, next) => {
  const { bookTitle, photoUrl, tags, date, pageNumber } = req.body
  const selectedItemId = req.params.itemId;

  let selectedEntry;
  try {
    selectedEntry = await Entry.findById(selectedItemId)
  } catch (err) {
    const error = new HttpError("Sorry, could not find the specified entry!", 500);
    return next (error)
  }

  selectedEntry.bookTitle = bookTitle;
  selectedEntry.photoUrl = photoUrl;
  selectedEntry.tags = tags;
  selectedEntry.date = date;
  selectedEntry.pageNumber = pageNumber;

  try {
    await selectedEntry.save()
  } catch(err) {
    const error = new HttpError("Sorry, could not update this entry!", 500);
    return next (error);
  }

  res.status(200).json({entry: selectedEntry.toObject({ getters: true })});
};

exports.createBook = createBook;
exports.createEntry = createEntry;
exports.deleteEntry = deleteEntry;
exports.getEntryByItemId = getEntryByItemId;
exports.getUserBooks = getUserBooks;
exports.getUserEntriesByUserId = getUserEntriesByUserId;
exports.updateEntry = updateEntry;