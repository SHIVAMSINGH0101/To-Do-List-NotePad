//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const date = require(__dirname+"/date.js");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//connect to mongoose Server
mongoose.connect("mongodb://localhost:27017/todolistDB",{useNewUrlParser: true, useUnifiedTopology: true });

//create a schema for our data
const itemsSchema = new mongoose.Schema({
  name: String
});

//create a model
const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Code"
});

const item2 = new Item({
  name: "Eat"
});

const item3 = new Item({
  name: "Sleep and Repeat"
});

//adding items to our database
const defaultItems = [item1, item2, item3];

//creating another document schema for other route
const listSchema = {
  name: String,
  items: [itemsSchema]
};

//creating model for our new document
const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {

  Item.find({}, function(err, ourDefaultItems){
    // insert default items only once so insert when "ourDefaultItems" is empty
    if(ourDefaultItems.length === 0){
      Item.insertMany(defaultItems, function(err){
        if(err)
          console.log(err);
        else
            console.log("Sucessfully inserted default items to DB");
      });
      res.redirect("/");
    }
    else{
      res.render("list", {listTitle: date.getDate(), newListItems: ourDefaultItems});
    }

  });

});


app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
      if(!err)
        if(!foundList){
          //create new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/" + customListName);
        }
        else{
          //show existing list
          res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
        }

    });


});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.listName;

  const item = new Item({
    name: itemName
  });

  if(listName === date.getDate()){
    item.save();
    res.redirect("/");
  }
  else{
    //find that object with the custom route name and then save in that objects array "items"
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });

  }


});


app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
// to see we are making delete request from which route i.e. which list
  if(listName === date.getDate()){
    Item.deleteOne({_id: checkedItemId}, function(err){
      if(err)
        console.log(err);
      else
          {
            console.log("Sucessfully deleted");
            res.redirect("/");
          }
    });
  }
  else{
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }


});


app.listen(3000, function() {
  console.log("Server started on port 3000");
});
