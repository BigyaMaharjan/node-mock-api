const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json()); // Middleware to parse JSON request bodies

// Dummy Data
let users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Doe", email: "jane@example.com" }
];

let products = [
  { id: 101, name: "Laptop", price: 1000 },
  { id: 102, name: "Phone", price: 500 }
];

let orders = [
  { id: 201, userId: 1, productId: 101, status: "Pending" },
  { id: 202, userId: 2, productId: 102, status: "Shipped" }
];

let categories = [
  { id: 301, name: "Electronics" },
  { id: 302, name: "Clothing" }
];

// Welcome Route
app.get("/", (req, res) => {
  res.send("Welcome to the Enhanced Dummy API!");
});

// Users Endpoints
app.get("/users", (req, res) => res.json(users));
app.post("/users", (req, res) => {
  const newUser = { id: users.length + 1, ...req.body };
  users.push(newUser);
  res.json({ message: "User added!", user: newUser });
});
app.put("/users/:id", (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ message: "User not found!" });
  Object.assign(user, req.body);
  res.json({ message: "User updated!", user });
});
app.delete("/users/:id", (req, res) => {
  users = users.filter(u => u.id !== parseInt(req.params.id));
  res.json({ message: "User deleted!" });
});

// Products Endpoints
app.get("/products", (req, res) => res.json(products));
app.post("/products", (req, res) => {
  const newProduct = { id: products.length + 101, ...req.body };
  products.push(newProduct);
  res.json({ message: "Product added!", product: newProduct });
});
app.put("/products/:id", (req, res) => {
  const product = products.find(p => p.id === parseInt(req.params.id));
  if (!product) return res.status(404).json({ message: "Product not found!" });
  Object.assign(product, req.body);
  res.json({ message: "Product updated!", product });
});
app.delete("/products/:id", (req, res) => {
  products = products.filter(p => p.id !== parseInt(req.params.id));
  res.json({ message: "Product deleted!" });
});

// Orders Endpoints
app.get("/orders", (req, res) => res.json(orders));
app.post("/orders", (req, res) => {
  const newOrder = { id: orders.length + 201, ...req.body };
  orders.push(newOrder);
  res.json({ message: "Order placed!", order: newOrder });
});
app.put("/orders/:id", (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  if (!order) return res.status(404).json({ message: "Order not found!" });
  Object.assign(order, req.body);
  res.json({ message: "Order updated!", order });
});
app.delete("/orders/:id", (req, res) => {
  orders = orders.filter(o => o.id !== parseInt(req.params.id));
  res.json({ message: "Order deleted!" });
});

// Categories Endpoints
app.get("/categories", (req, res) => res.json(categories));
app.post("/categories", (req, res) => {
  const newCategory = { id: categories.length + 301, ...req.body };
  categories.push(newCategory);
  res.json({ message: "Category added!", category: newCategory });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});