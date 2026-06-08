// ---- Data Storage ----
if (!localStorage.getItem('tractor_users')) {
  localStorage.setItem('tractor_users', JSON.stringify([]));
}
if (!localStorage.getItem('work_entries')) {
  localStorage.setItem('work_entries', JSON.stringify([]));
}

// ---- Page Logic ----
function selectRole(role) {
  document.getElementById('role-selection').classList.add('hidden');
  if (role === 'owner') {
    document.getElementById('owner-section').classList.remove('hidden');
    showOwnerTab('create-account');
  } else {
    document.getElementById('customer-section').classList.remove('hidden');
  }
}

function logout() {
  // Hide all main sections
  document.getElementById('owner-section').classList.add('hidden');
  document.getElementById('customer-section').classList.add('hidden');
  document.getElementById('customer-dashboard').classList.add('hidden');

  // Show starting page role selection
  document.getElementById('role-selection').classList.remove('hidden');

  // Clear customer login form inputs and error
  document.getElementById('customer-login-form').reset();
  document.getElementById('customer-login-error').innerText = '';

  // Clear customer dashboard table
  const tbody = document.querySelector('#work-table tbody');
  if (tbody) tbody.innerHTML = '';
  document.getElementById('total-balance').innerText = '₹0.00';

  // Clear owner panel content and errors
  document.getElementById('owner-panel-content').innerHTML = '';
}

// ---- Owner Panel ----
function showOwnerTab(tab) {
  const panel = document.getElementById('owner-panel-content');
  
  if (tab === 'create-account') {
    panel.innerHTML = `
      <h3>Create Customer Account</h3>
      <form id="create-customer-form">
        <input type="text" id="ca-username" placeholder="Customer Username" required /><br />
        <input type="password" id="ca-password" placeholder="Customer Password" required /><br />
        <input type="text" id="ca-name" placeholder="Customer Name" required /><br />
        <button type="submit">Create Account</button>
      </form>
      <div id="ca-error" class="error"></div>
    `;
    document.getElementById('create-customer-form').onsubmit = function (e) {
      e.preventDefault();
      createCustomerAccount();
    };
    
  } else if (tab === 'log-work') {
    panel.innerHTML = `
      <h3>Enter Work Details</h3>
      <form id="work-entry-form">
        <input type="text" id="we-username" placeholder="Customer Username" required /><br />
        <input type="date" id="we-date" required /><br />
        In Time: <input type="time" id="we-intime" required /><br />
        Out Time: <input type="time" id="we-outtime" required /><br />
        Amount per hour: <input type="number" id="we-rate" min="0" required /><br />
        Type of Cultivator: <input type="text" id="we-cultivator" required /><br />
        <button type="submit">Log Work</button>
      </form>
      <div id="we-error" class="error"></div>
    `;
    document.getElementById('work-entry-form').onsubmit = function (e) {
      e.preventDefault();
      logWorkEntry();
    };
    
  } else if (tab === 'update-payment') {
    panel.innerHTML = `
      <h3>Update Customer Payment</h3>
      <form id="update-payment-form">
        <input type="text" id="up-username" placeholder="Customer Username" required /><br />
        <label for="up-amount">Amount Paid:</label>
        <input type="number" id="up-amount" min="0" step="0.01" placeholder="Enter Payment Amount" required /><br />
        <button type="submit">Update Payment</button>
      </form>
      <div id="up-error" class="error"></div>
      <div id="up-success" style="color:green; margin-top:8px;"></div>
    `;
    document.getElementById('update-payment-form').onsubmit = function (e) {
      e.preventDefault();
      updateCustomerPayment();
    };
  } else if (tab === 'view-customers') {
    const users = JSON.parse(localStorage.getItem('tractor_users')) || [];
    const workEntries = JSON.parse(localStorage.getItem('work_entries')) || [];

    panel.innerHTML = `
      <h3>All Customers</h3>
      <input type="text" id="search-name-input" placeholder="Search by customer name" 
             style="padding:6px; width: 100%; max-width: 300px; margin-bottom: 10px; font-size:1rem;" />
      <table id="customers-table" style="width:100%; border-collapse: collapse;" border="1">
        <thead>
          <tr>
            <th>Username</th>
            <th>Name</th>
            <th>Total Work Entries</th>
            <th>Total Balance</th>
            <th>View Details</th>
            <th>Update Payment</th>
            <th>Edit</th>
          </tr>
        </thead>
        <tbody>
          ${users.map(user => {
            const customerWorks = workEntries.filter(e => e.username === user.username);
            const totalAmount = customerWorks.reduce((sum, e) => sum + e.amount, 0);
            const totalPaid = customerWorks.reduce((sum, e) => sum + e.paid, 0);
            const balance = totalAmount - totalPaid;
            return `
              <tr>
                <td>${user.username}</td>
                <td class="customer-name">${user.name}</td>
                <td>${customerWorks.length}</td>
                <td>₹${balance.toFixed(2)}</td>
                <td><button onclick="window.location.href='customer-details.html?username=${encodeURIComponent(user.username)}'">View Details</button></td>
                <td><button onclick="window.location.href='update-payment.html?username=${encodeURIComponent(user.username)}'">Update Payment</button></td>
                <td><button onclick="window.location.href='edit-customer.html?username=${encodeURIComponent(user.username)}'">Edit</button></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    `;

    const searchInput = document.getElementById('search-name-input');
    searchInput.addEventListener('input', function () {
      const filter = this.value.toLowerCase();
      const rows = panel.querySelectorAll('#customers-table tbody tr');
      rows.forEach(row => {
        const nameCell = row.querySelector('.customer-name');
        if (nameCell && nameCell.textContent.toLowerCase().includes(filter)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }
}

function createCustomerAccount() {
  let users = JSON.parse(localStorage.getItem('tractor_users')) || [];
  const username = document.getElementById('ca-username').value.trim();
  const password = document.getElementById('ca-password').value;
  const name = document.getElementById('ca-name').value.trim();

  if (users.some((u) => u.username === username)) {
    document.getElementById('ca-error').innerText = "Username already exists.";
    return;
  }
  users.push({
    username,
    password,
    name,
    paid: 0,
  });
  localStorage.setItem("tractor_users", JSON.stringify(users));
  document.getElementById("ca-error").innerText = "Account created!";
}

function logWorkEntry() {
  let users = JSON.parse(localStorage.getItem("tractor_users")) || [];
  let workEntries = JSON.parse(localStorage.getItem("work_entries")) || [];
  const username = document.getElementById("we-username").value.trim();
  const date = document.getElementById("we-date").value;
  const intime = document.getElementById("we-intime").value;
  const outtime = document.getElementById("we-outtime").value;
  const rate = parseFloat(document.getElementById("we-rate").value);
  const cultivator = document.getElementById("we-cultivator").value;

  if (!users.some((u) => u.username === username)) {
    document.getElementById("we-error").innerText = "Customer not found!";
    return;
  }

  const t1 = new Date(`${date}T${intime}`);
  const t2 = new Date(`${date}T${outtime}`);
  let totalHours = (t2 - t1) / 1000 / 3600;
  if (totalHours <= 0) {
    document.getElementById("we-error").innerText = "Out time must be after in time!";
    return;
  }
  const amount = rate * totalHours;

  workEntries.push({
    username,
    date,
    intime,
    outtime,
    cultivator,
    rate,
    totalHours,
    amount,
    paid: 0,
  });
  localStorage.setItem("work_entries", JSON.stringify(workEntries));
  document.getElementById("we-error").innerText = "Work entry saved.";
}

function updateCustomerPayment() {
  const username = document.getElementById("up-username").value.trim();
  const amountPaid = parseFloat(document.getElementById("up-amount").value);

  if (!username || isNaN(amountPaid) || amountPaid < 0) {
    document.getElementById("up-error").innerText = "Please enter a valid username and payment amount.";
    document.getElementById("up-success").innerText = "";
    return;
  }

  let users = JSON.parse(localStorage.getItem("tractor_users")) || [];
  let user = users.find((u) => u.username === username);
  if (!user) {
    document.getElementById("up-error").innerText = "Customer not found.";
    document.getElementById("up-success").innerText = "";
    return;
  }

  let workEntries = JSON.parse(localStorage.getItem("work_entries")) || [];
  let customerEntries = workEntries.filter((e) => e.username === username);

  if (customerEntries.length === 0) {
    document.getElementById("up-error").innerText = "This customer has no work entries.";
    document.getElementById("up-success").innerText = "";
    return;
  }

  const totalAmount = customerEntries.reduce((sum, e) => sum + e.amount, 0);
  const totalPaidBefore = customerEntries.reduce((sum, e) => sum + e.paid, 0);
  const totalBalance = totalAmount - totalPaidBefore;

  if (amountPaid > totalBalance) {
    document.getElementById("up-error").innerText = `Payment exceeds balance (₹${totalBalance.toFixed(2)}).`;
    document.getElementById("up-success").innerText = "";
    return;
  }

  let amountToPay = amountPaid;
  for (let i = 0; i < workEntries.length && amountToPay > 0; i++) {
    let entry = workEntries[i];
    if (entry.username === username) {
      let entryBalance = entry.amount - entry.paid;
      if (entryBalance > 0) {
        let paymentForEntry = Math.min(entryBalance, amountToPay);
        entry.paid += paymentForEntry;
        amountToPay -= paymentForEntry;
      }
    }
  }

  localStorage.setItem("work_entries", JSON.stringify(workEntries));
  document.getElementById("up-error").innerText = "";
  document.getElementById("up-success").innerText = "Payment updated successfully.";
}

// ---- Customer Panel ----
document.getElementById("customer-login-form").onsubmit = function (e) {
  e.preventDefault();
  customerLogin();
};

function customerLogin() {
  const username = document.getElementById("customer-username").value.trim();
  const password = document.getElementById("customer-password").value;

  let users = JSON.parse(localStorage.getItem("tractor_users")) || [];
  const customer = users.find(
    (u) => u.username === username && u.password === password
  );
  if (!customer) {
    document.getElementById("customer-login-error").innerText = "Login failed.";
    return;
  }
  document.getElementById("customer-login-form").classList.add("hidden");
  showCustomerDashboard(username);
}

function showCustomerDashboard(username) {
  document.getElementById("customer-dashboard").classList.remove("hidden");

  let workEntries = JSON.parse(localStorage.getItem("work_entries")) || [];
  let userEntries = workEntries.filter(
    (e) => e.username === username
  );

  let tbody = document.querySelector("#work-table tbody");
  tbody.innerHTML = "";

  let totalBalance = 0;

  userEntries.forEach(entry => {
    const balance = entry.amount - entry.paid;
    totalBalance += balance;
    tbody.innerHTML += `
      <tr>
        <td>${entry.date}</td>
        <td>${entry.intime}</td>
        <td>${entry.outtime}</td>
        <td>${entry.cultivator}</td>
        <td>${entry.totalHours.toFixed(2)}</td>
        <td>₹${entry.amount.toFixed(2)}</td>
        <td>₹${entry.paid.toFixed(2)}</td>
        <td>₹${balance.toFixed(2)}</td>
      </tr>
    `;
  });

  document.getElementById("total-balance").innerText = `₹${totalBalance.toFixed(2)}`;
}
