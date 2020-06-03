const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const capitalize = require('lodash.capitalize');

const date = require(__dirname + '/date.js');
const day = date.getDate();

const app = express();

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static('public'));

app.set('view engine', 'ejs');

mongoose.connect('mongodb+srv://admin-benjamin:TestPassword@todocluster-ummqy.mongodb.net/todolistDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false
});

const itemsSchema = {
  name: {
    type: String,
    required: [true, 'Your to-do need a name!']
  }
}

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item({
  name: 'Welcome to your To-Do List!'
});
const item2 = new Item({
  name: 'Hit the + button to add a new item.'
});
const item3 = new Item({
  name: '<-- Hit this to mark an item as done.'
});
const defaultItems = [item1, item2, item3];


const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port, () => {
  console.log('Server has started succesfully.');
});

app.get('/:customListName', (req, res) => {
  const customListName = capitalize(req.params.customListName);

  List.findOne({name: customListName}, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        // create new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect('/' + customListName);
      } else {
        // show existing list
        res.render('list', {
          listTitle: foundList.name,
          newListItems: foundList.items
        });
      }
    }
  });
})

app.get('/', (req, res) => {
  Item.find({}, (err, foundItems) => {
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, (err) => {
        if (err) {
          console.log(err);
        } else {
          console.log('Successfully inserted default documents.');
        }
      });
      res.redirect('/');
    } else {
      res.render('list', {
        listTitle: 'To-Do-List',
        newListItems: foundItems
      });
    }
  })
})

app.post('/', (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName
  });

  if (listName === 'To-Do-List') {
    item.save();
    res.redirect('/');
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      res.redirect('/' + listName);
    })
  }
})

app.post('/delete', (req, res) => {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === 'To-Do-List') {
    Item.findByIdAndRemove(checkedItemId, (err) => {
      if (err) {
        console.log(err);
      } else {
        console.log('Successfully deleted item.');
        res.redirect('/');
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, (err, foundItem) => {
      if (!err) {
        res.redirect('/' + listName);
      }
    })
  }

});

app.get('/about', (req, res) => {
  res.render('about')
})
