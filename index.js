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
              <script>
                window.onload = function() {
                  if (performance.navigation.type === 2) { 
                    location.reload(); // Force reload of the page
                  }
                };
              </script>

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
                .balance {
                  text-align: center; 
                  font-size: 24px; 
                  margin-top: 20px; 
                  font-weight: bold; 
            
                }
                .navbar {
                  background-color: #333;
                  overflow: hidden;
                  display: flex;
                  justify-content: space-around;
                }

                .navbar a {
                  float: left;
                  display: block;
                  color: white;
                  text-align: center;
                  padding: 14px 16px;
                  text-decoration: none;
                }

                button {
                  background-color: #4CAF50;
                  color: white;
                  border: none;
                  cursor: pointer;
                  padding: 10px 20px;
                }

                button:hover {
                  background-color: #45a049;
                }
              </style>
            </head>
            <body>
            <div class="navbar">
              <a href="/news"><button>News</button></a>
              <a href="/transfer"><button>Transfer Money</button></a>
              <a href="/profile/${user.customer_id}"><button>Profile</button></a>
            </div>
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
                <a href="/transaction-history/${user.customer_id}"><button>More</button></a>

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
          // Redirect to the transaction history page
          res.redirect(`/transaction-history/${customerId}`);
        });
      });
    });
  });
});

app.get("/transaction-history/:customerId", (req, res) => {
  const { customerId } = req.params;
  const transactionsQuery = `
    SELECT type, amount, timestamp, reason 
    FROM transaction 
    WHERE account_number = (SELECT account_number FROM bank_account WHERE customer_id = ?) 
    ORDER BY timestamp DESC`;

  connection.query(transactionsQuery, [customerId], (error, transactions) => {
    if (error) {
      res.status(500).send("Error fetching transactions");
      return;
    }

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
      <title>Transaction History</title>
      <style>
      button {
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        padding: 10px 20px;
      }

      button:hover {
        background-color: #45a049;
      }
        table {
          border-collapse: collapse;
          width: 60%; 
          margin: 0 auto; 
        }

        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
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
        button {
          margin: 20px;
        }
      </style>
      </head>
      <body>
        <h1>Transaction History</h1>
        <button onclick="window.history.back();">Back</button>
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
      </body>
      </html>
    `);
  });
});
app.get("/news", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>News</title>
    <style>
    button {
      background-color: #4CAF50;
      color: white;
      border: none;
      cursor: pointer;
      padding: 10px 20px;
    }

    button:hover {
      background-color: #45a049;
    }
      button {
        margin: 20px;
      }
    </style>
    </head>
    <body>
      <h1>Daily Orario</h1>
      <button onclick="window.history.back();">Back</button>
      <hr></hr>
      <h2>The King is Challenged?</h2>
      <p>Sources within the Freya Familia compound have revealed exclusively to The Daily Orario that for the first time in a long time someone has actually challenged Freya Familia Captain Ottar to a duel! The challenger is reportedly none other than the young Percy Levental, an Executive with the Loki Familia. Eyewitnesses said the fight was epic, and that Percy managed to last several rounds with Ottar before finally conceding the match to the Captain of the Freya Familia. It was reported that this was an unofficial and friendly non-lethal sparring match only, and that the two familias are not expected to go to war over it at this time. </p>
    <hr></hr>
    <h2>Ganesha Family Member detained for Questioning</h2>
    <p>Yesterday afternoon the Ganesha Familia conducted a raid on the Popular Casino where the Famous "Mind Zer0 Jeopardy" takes place. On the raid multiple individuals where held into Questioning by the Familia for fraud. One of those individuals was Aptu Saiph. Ganesha's own Familia member. The Officer in charge of the raid refused to make a statement</p>
    <hr></hr>
    <h2>Bank of Percy at the edge of collaps?</h2>
    <p>The Bank of Percy in Orario is navigating a period of investment challenges as recent ventures have not yielded expected returns. The bank, traditionally seen as stable, experienced losses in riskier market endeavors. While the exact extent of the setbacks remains undisclosed, the bank is actively addressing the situation with measures aimed at stabilizing its financial standing. Customers are reassured that their deposits are secure, and experts are closely monitoring developments in the local financial landscape.</p>
    </body>
    </html>
  `);
});

app.get("/transfer", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Transfer Money</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f4f4f4;
        padding: 20px;
      }
      form {
        background-color: #fff;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 0 10px rgba(0,0,0,0.1);
        margin-bottom: 10px;
      }
      input[type=text], input[type=number] {
        width: calc(100% - 22px);
        padding: 10px;
        margin: 10px 0;
        display: inline-block;
        border: 1px solid #ccc;
        box-sizing: border-box;
      }
      label {
        display: block;
        margin-top: 10px;
      }
      .back-button {
        background-color: #4CAF50;
        color: white;
        border: none;
        cursor: pointer;
        padding: 10px 20px;
        margin: 20px 0;
        text-align: center;
        display: inline-block; 
        font-size: 16px;
        transition: background-color 0.3s ease;
      }
    </style>
    </head>
    <body>
      <h1>Transfer Money</h1>
      <button class="back-button" onclick="window.history.back();">Back</button>
      <form action="/perform-transfer" method="post">
        <label for="recipientName">Recipient's First Name:</label>
        <input type="text" id="recipientName" name="recipientName" required>

        <label for="recipientAccountId">Recipient's Account ID:</label>
        <input type="number" id="recipientAccountId" name="recipientAccountId" required>

        <label for="amount">Amount:</label>
        <input type="number" id="amount" name="amount" min="0.01" step="0.01" required>

        <label for="reason">Reason for Transfer:</label>
        <input type="text" id="reason" name="reason" required>
        
        <label for="ID">Your ID:</label>
        <input type="number" id="id" name="id" required>
        
        <button type="submit">Transfer</button>
      </form>
    </body>
    </html>
  `);
});

app.post("/perform-transfer", (req, res) => {
  const { recipientAccountId, amount, reason, id } = req.body;

  // Start transaction
  connection.beginTransaction(error => {
    if (error) {
      res.status(500).send("Failed to start transaction.");
      return;
    }

    // Withdraw from sender's account
    const updateUserBalanceQuery = `UPDATE bank_account SET balance = balance - ? WHERE customer_id = ? AND balance >= ?`;
    connection.query(updateUserBalanceQuery, [amount, id, amount], (error, results) => {
      if (error || results.affectedRows === 0) {
        return connection.rollback(() => {
          res.status(500).send("Insufficient funds or error withdrawing.");
        });
      }

      // Log sender's transaction
      const createUserTransactionQuery = `INSERT INTO transaction (account_number, type, amount, reason, timestamp) VALUES ((SELECT account_number FROM bank_account WHERE customer_id = ?), 'withdrawal', ?, ?, NOW())`;
      connection.query(createUserTransactionQuery, [id, amount, reason], (error, results) => {
        if (error) {
          return connection.rollback(() => {
            res.status(500).send("Failed to log sender's transaction.");
          });
        }

        // Deposit to recipient's account
        const updateRecipientBalanceQuery = `UPDATE bank_account SET balance = balance + ? WHERE customer_id = ?`;
        connection.query(updateRecipientBalanceQuery, [amount, recipientAccountId], (error, results) => {
          if (error) {
            return connection.rollback(() => {
              res.status(500).send("Error depositing funds.");
            });
          }

          // Log recipient's transaction
          const createRecipientTransactionQuery = `INSERT INTO transaction (account_number, type, amount, reason, timestamp) VALUES ((SELECT account_number FROM bank_account WHERE customer_id = ?), 'deposit', ?, ?, NOW())`;
          connection.query(createRecipientTransactionQuery, [recipientAccountId, amount, reason], (error, results) => {
            if (error) {
              return connection.rollback(() => {
                res.status(500).send("Failed to log recipient's transaction.");
              });
            }

            // Commit transaction
            connection.commit(err => {
              if (err) {
                return connection.rollback(() => {
                  res.status(500).send("Failed to commit transaction.");
                });
              }
            });
          });
        });
      });
    });
  });
});


app.get("/profile/:customerId", (req, res) => {
  // Check if customer_id is provided in the query parameters
  const { customerId } = req.params;
  const userQuery = `SELECT customer_id, first_name, password FROM customers WHERE customer_id = ?`;

  // Execute the query to fetch user data
  connection.query(userQuery, [customerId], (error, results) => {
    if (error) {
      return res.status(500).send("Error fetching user profile.");
    }

    if (results.length > 0) {
      const user = results[0];
      res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>User Profile</title>
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
          div {
            background-color: #fff;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
          }
          .back-button {
            background-color: #4CAF50;
            color: white;
            border: none;
            cursor: pointer;
            padding: 10px 20px;
            margin: 20px 0;
            text-align: center;
            display: inline-block; 
            font-size: 16px;
            transition: background-color 0.3s ease;
          }
        </style>
        </head>
        <body>
          <div>
            <h1>User Profile</h1>
            <p><b>Name:</b> ${user.first_name}</p>
            <p><b>ID:</b> ${user.customer_id}</p>
            <p><b>Password:</b> ${user.password}</p> <!-- Not recommended to show passwords in plain text -->
            <button class="back-button" onclick="window.history.back();">Back</button>
          </div>
        </body>
        </html>
      `);
    } else {
      res.send("User not found.");
    }
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
