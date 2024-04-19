const express = require("express");
const mysql = require("mysql");
const bodyParser = require("body-parser");
const app = express();
const port = process.env.PORT || 3000;

// Body parser middleware to handle form data
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// MySQL connection settings
const connection = mysql.createConnection({
  host: process.env["HOST"],
  user: process.env["USER"],
  password: process.env["PASSWORD"],
  database: process.env["DATABASE"],
});

// Connect to MySQL
connection.connect((error) => {
  if (error) throw error;
  console.log("Successfully connected to the database.");
});

//styled login form
app.get("/", (req, res) => {
  res.send(`
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Login Page</title>
      <style>
        body { 
          font-family: Arial, sans-serif; 
          background-color: #f4f4f4; 
          display: flex; 
          justify-content: center; 
          align-items: center; 
          height: 100vh; 
          margin: 0; 
        }
        form { 
          background-color: #fff; 
          padding: 20px; 
          border-radius: 5px; 
          box-shadow: 0 0 10px rgba(0,0,0,0.1); 
        }
        input[type=text], input[type=password] {
          width: 100%; 
          padding: 10px; 
          margin: 10px 0; 
          display: inline-block; 
          border: 1px solid #ccc; 
          box-sizing: border-box;
        }
        button {
          background-color: #4CAF50; 
          color: white; 
          padding: 14px 20px; 
          margin: 8px 0; 
          border: none; 
          cursor: pointer; 
          width: 100%;
        }
        button:hover {
          opacity: 0.8;
        }
      </style>
    </head>
    <body>
      <form action="/login" method="post">
        <h2>Login Here</h2>
        <label for="first_name"><b>First Name</b></label>
        <input type="text" placeholder="Enter First Name" name="first_name" required>

        <label for="password"><b>Password</b></label>
        <input type="password" placeholder="Enter Password" name="password" required>

        <button type="submit">Login</button>
      </form>
    </body>
    </html>
  `);
});

// Handle login logic
app.post("/login", (req, res) => {
  const { first_name, password } = req.body;
  const query = `SELECT * FROM customers WHERE first_name = ? AND password = ?`;

  connection.query(query, [first_name, password], (error, results) => {
    if (error) throw error;
    if (results.length > 0) {
      res.send(
        `<h1>Welcome ${first_name}</h1><p>Your account details are: ${JSON.stringify(results[0])}</p>`,
      );
    } else {
      res.send(`
        <h1>Login</h1>
        <p>Incorrect first name or password.</p>
        <form action="/login" method="post">
          <input type="text" name="first_name" placeholder="Enter your first name" required>
          <input type="password" name="password" placeholder="Enter your password" required>
          <button type="submit">Login</button>
        </form>
      `);
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
