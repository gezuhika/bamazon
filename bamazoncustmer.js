// Initializes the npm packages used
var mysql = require("mysql");
var inquirer = require("inquirer");
require("console.table");

// Initializes the connection variable to sync with a MySQL database
var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,

  // Your username
  user: "root",

  // Your password
  password: "",
  database: "bamazon"
});
connection.connect(function(err) {
  if (err) {
    console.error("error connecting: " + err.stack);
  }
  loadProducts();
});
function loadProducts() {
  // Selects all of the data from the MySQL products table
  connection.query("SELECT * FROM products", function(err, res) {
    if (err) throw err;

    // Draw the table in the terminal using the response
    console.table(res);
    promptCustomerForItem(res);
  });
}

// Prompt the customer for a product ID
function promptCustomerForItem(inventory) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "choice",
        message: "What is the ID of the item you would you like to purchase? [Quit with Q]",
        validate: function(val) {
          return !isNaN(val) || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function(val) {
      checkIfShouldExit(val.choice);
      var choiceId = parseInt(val.choice);
      var product = checkInventory(choiceId, inventory);

      // If there is a product with the id the user chose, prompt the customer for a desired quantity
      if (product) {
        promptCustomerForQuantity(product);
      }
      else {
        console.log("\nThat item is not in the inventory.");
        loadProducts();
      }
    });
}

// Prompt the customer for a product quantity
function promptCustomerForQuantity(product) {
  inquirer
    .prompt([
      {
        type: "input",
        name: "quantity",
        message: "How many would you like? [Quit with Q]",
        validate: function(val) {
          return val > 0 || val.toLowerCase() === "q";
        }
      }
    ])
    .then(function(val) {
      // Check if the user wants to quit the program
      checkIfShouldExit(val.quantity);
      var quantity = parseInt(val.quantity);

      if (quantity > product.stock_quantity) {
        console.log("\nInsufficient quantity!");
        loadProducts();
      }
      else {
        makePurchase(product, quantity);
      }
    });
}

// Purchase the desired quanity of the desired item
function makePurchase(product, quantity) {
  connection.query(
    "UPDATE products SET stock_quantity = stock_quantity - ? WHERE item_id = ?",
    [quantity, product.item_id],
    function(err, res) {
      console.log("\nSuccessfully purchased " + quantity + " " + product.product_name + "'s!");
      loadProducts();
    }
  );
}

function checkInventory(choiceId, inventory) {
  for (var i = 0; i < inventory.length; i++) {
    if (inventory[i].item_id === choiceId) {

      return inventory[i];
    }
  }

  return null;
}

function checkIfShouldExit(choice) {
  if (choice.toLowerCase() === "q") {

    console.log("Goodbye!");
    process.exit(0);
  }
}