const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("**************************", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to your to-do list!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

const day = date.getDate();

app.get("/", (req, res) => {
  Item.find({}, (err, items) => {
    if (items.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (!err) {
          console.log("Added default items to DB.");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: day, newListItems: items });
    }
  });
});

app.get("/:listName", (req, res) => {
  const listName = _.lowerCase(req.params.listName);

  List.findOne({ name: listName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

app.post("/", (req, res) => {
  const listName = req.body.list;
  const itemName = req.body.newItem;
  const item = new Item({
    name: itemName,
  });

  if (listName === day) {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      console.log("Added item to new to-do list");
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (!err) {
        console.log("Succefully deleted checked item");
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, () => {
  console.log("Server has started succefully.");
});
