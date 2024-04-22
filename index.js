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
  const userQuery = `SELECT * FROM customers WHERE first_name = ? AND password = ?`;

  connection.query(userQuery, [first_name, password], (error, users) => {
    if (error) throw error;
    if (users.length > 0) {
      const user = users[0];
      const balanceQuery = `SELECT balance FROM bank_account WHERE customer_id = ?`;
      const transactionsQuery = `SELECT type, amount, timestamp, reason FROM transaction WHERE account_number = (SELECT account_number FROM bank_account WHERE customer_id = ?) ORDER BY timestamp DESC LIMIT 3`;

      connection.query(balanceQuery, [user.customer_id], (error, accounts) => {
        if (error) throw error;
        if (accounts.length > 0) {
          const account = accounts[0];
          connection.query(transactionsQuery, [user.customer_id], (error, transactions) => {
            if (error) throw error;
            // Create the transaction table rows
            const transactionRows = transactions.map(t => `
              <tr>
                <td>${t.type}</td>
                <td>${t.amount}</td>
                <td>${new Date(t.timestamp).toLocaleString()}</td>
                <td>${t.reason}</td>
              </tr>
            `).join('');
          res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Welcome ${user.first_name}</title>
              <style>
                .transaction-form {
                  margin-top: 30px;
                }
                .form-control {
                  margin-bottom: 10px;
                }
                input, select, button {
                  padding: 10px;
                  width: 100%;
                  margin: 5px 0;
                }
                table {
                  border-collapse: collapse;
                  width: 60%; 
                  margin-left: auto;
                  margin-right: auto; 
                }

                th, td {
                  border: 1px solid #ddd; 
                  text-align: left;
                  padding: 8px;
                }

                th {
                  background-color: #f2f2f2; 
                  color: black;
                }

                tr:nth-child(even) {
                  background-color: #f9f9f9;
                }

                tr:hover {
                  background-color: #f1f1f1; 
                }
              </style>
            </head>
            <body>
              <div class="container">
                <h1>Welcome ${user.first_name}</h1>
                <div class="balance">Balance: ${account.balance}</div>
                <form action="/transaction" method="post" class="transaction-form">
                  <div class="form-control">
                    <select name="transactionType" required>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                  </div>
                  <div class="form-control">
                    <input type="number" name="amount" placeholder="Amount" min="0" step="0.01" required>
                  </div>
                  <div class="form-control">
                    <input type="text" name="reason" placeholder="Reason" maxlength="255">
                  </div>
                  <input type="hidden" name="customerId" value="${user.customer_id}">
                  <button type="submit">Submit</button>
                </form>
                <h2>Recent Transactions</h2>
                <table>
                  <thead>
                    <tr>
                      <th>Type</th>
                      <th>Amount</th>
                      <th>Timestamp</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${transactionRows}
                  </tbody>
                </table>
              </div>
            </body>
            </html>
          `);
        });
        }else{
          res.send('No account found.');
        }
      });
    } else {
      // Render the login form again with error message
      res.send(`
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Login Failed</title>
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
            <p style="color: red;">Incorrect first name or password.</p>
            <label for="first_name"><b>First Name</b></label>
            <input type="text" placeholder="Enter First Name" name="first_name" required>

            <label for="password"><b>Password</b></label>
            <input type="password" placeholder="Enter Password" name="password" required>

            <button type="submit">Login</button>
          </form>
        </body>
        </html>
      `);
    }
  });
});

app.post("/transaction", (req, res) => {
  const { transactionType, amount, reason, customerId } = req.body;


  // Start transaction
  connection.beginTransaction(error => {
    if (error) { throw error; }

    // Perform the deposit or withdrawal
    const balanceChange = transactionType === 'deposit' ? amount : -amount;
    const updateBalanceQuery = `UPDATE bank_account SET balance = balance + ? WHERE customer_id = ?`;

    connection.query(updateBalanceQuery, [balanceChange, customerId], (error, results) => {
      if (error) {
        return connection.rollback(() => {
          throw error;
        });
      }

      // Create the transaction record
      const createTransactionQuery = `INSERT INTO transaction (account_number, type, amount, reason, timestamp) SELECT account_number, ?, ?, ?, NOW() FROM bank_account WHERE customer_id = ?`;

      connection.query(createTransactionQuery, [transactionType, amount, reason, customerId], (error, results) => {
        if (error) {
          return connection.rollback(() => {
            throw error;
          });
        }

        connection.commit(err => {
          if (err) {
            return connection.rollback(() => {
              throw err;
            });
          }
          // Successfully committed
          res.send(`Transaction completed successfully.`);
        });
      });
    });
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
