Project Summary

HealthChain is a healthcare record management demo built around a simulated blockchain ledger. The main idea is simple: each patient record becomes a block, each block contains a hash, and every block points to the previous block’s hash. If a record is changed without updating the hashes, the chain becomes invalid.

The core blockchain logic is in Backend/app/services/blockchain.py, the hashing logic is in Backend/app/services/hashing.py, and the block structure is defined in Backend/app/models/block.py.

1. What the project is designed to do

The project demonstrates five main concepts:

Add a patient record
Store it as a blockchain block
Link each block using the previous hash
Validate the chain using SHA-256
Detect tampering when someone changes data without rehashing
So this is not a real hospital EMR system. It is a blockchain integrity demo for healthcare data.

2. Overall architecture

The app has two parts:

Frontend: React + Vite
Backend: Flask
The entry point for the backend is Backend/main.py. It creates the config, blockchain instance, and Flask web app.

The Flask app factory is in Backend/app/web/init.py. It registers the web routes and also adds CORS headers.

The frontend router is in frontend/src/App.jsx. The shared app shell is in frontend/src/components/Layout.jsx and the shared state is in frontend/src/context/AppContext.jsx.

3. How the blockchain works

Each block has these fields:

index
timestamp
patient_data
previous_hash
current_hash
That structure is in Backend/app/models/block.py.

Blocks are created through Backend/app/models/block_factory.py, which:

creates a placeholder block
calculates the hash
stores the final hash in current_hash
The hash is calculated using SHA-256 in Backend/app/services/hashing.py. The backend builds a JSON payload from the block fields, sorts the keys, encodes it, and hashes it. That means even a tiny data change changes the hash.

The blockchain service in Backend/app/services/blockchain.py does the real ledger work:

creates the genesis block
adds new blocks
validates the chain
imports and exports the ledger
handles tampering
updates patient records and recalculates downstream hashes
The ledger is persisted to disk using Backend/app/services/storage_service.py, which reads and writes JSON to the configured ledger file.

4. Backend configuration

The runtime config is in Backend/app/config/settings.py.

Important settings:

ledger_path: where the blockchain JSON is stored
hashing_algorithm: default is sha256
host: 0.0.0.0
port: 5000
debug: controlled by the HEALTHCHAIN_DEBUG environment variable
secret_key: Flask session secret
So the backend is intentionally configured to run locally and persist the ledger in JSON form.

5. Backend routes

All web routes are defined in Backend/app/controllers/web_controller.py.

Main routes:

GET / → dashboard page
GET /records → add record page
GET /chain → ledger explorer page
GET /security → security/demo page
POST /records → form submit for adding a record from the Flask template UI
GET /blockchain and GET /api/blockchain → return the chain as JSON
POST /block and POST /api/block → add a new block from JSON
PUT /records/<patient_id> and PUT /api/records/<patient_id> → update an existing patient record
GET /validate and GET /api/validate → return validation status as JSON
POST /validate and POST /api/validate → flash-based validation page action
PUT /tamper/<index> and PUT /api/tamper/<index> → tamper with a block via JSON
POST /tamper → flash-based tamper demo
GET /ledger/export and GET /api/ledger/export → export the ledger JSON
POST /ledger/import and POST /api/ledger/import → import and validate a full ledger
The routes support both the direct form-style backend pages and the React frontend API flow.

6. Frontend structure

The frontend app is built in React and starts from frontend/src/main.jsx. It wraps the app in the browser router and the app context provider.

The main route map is in frontend/src/App.jsx:

/login
/register
protected routes under the main app shell:
/dashboard
/add-record
/ledger
/validate
/tamper
/reports
/settings
If the user is not logged in, frontend/src/components/ProtectedRoute.jsx redirects them to login.

The main layout no longer uses the side navigation. The shell is now mostly a top navigation bar plus the page content area in frontend/src/components/Layout.jsx and frontend/src/components/Navbar.jsx.

7. Authentication and profile data

This project uses browser-local authentication, not server-side auth.

Login/register logic is in:

frontend/src/lib/authStorage.js
What it does:

stores users in localStorage
stores the active session in localStorage
validates login against saved browser users
keeps passwords local to the browser only
Profile settings are in:

frontend/src/lib/settingsStorage.js
That page stores:

name
email
role
Again, this is browser-only demo state.

8. Shared frontend state

The app-wide frontend state is in frontend/src/context/AppContext.jsx.

It stores:

current user
current blockchain chain
current integrity status
loading state
toast notifications
It also refreshes the ledger by calling:

GET /blockchain
GET /validate
This is why the whole app stays synchronized after add, edit, tamper, import, or validate actions.

9. API layer

The frontend talks to the backend through frontend/src/services/api.js.

Key methods:

getBlockchain()
getIntegrity()
addBlock()
updatePatientRecord()
validateChain()
tamperBlock()
exportLedger()
importLedger()
getReports()
So the frontend never talks directly to raw endpoints. It uses a small API wrapper.

10. Page-by-page explanation

Login Page
File: frontend/src/pages/Login.jsx

Purpose:

sign in to the demo app
What it does:

accepts email and password
checks them against browser-local saved users
redirects to the dashboard after success
This is a local demo authentication system, not a real identity provider.

Register Page
File: frontend/src/pages/Register.jsx

Purpose:

create a local demo account
What it does:

collects name, email, role, password, and confirm password
validates password length
validates matching passwords
stores the account in localStorage
This makes the app feel like a real hospital system, but the accounts are still local-only.

Dashboard Page
File: frontend/src/pages/Dashboard.jsx

Purpose:

give a quick overview of the system
What it shows:

total patients
total records
blocks created
data integrity status
a growth graph
recent records
latest block hash information
Important detail:

the graph now uses actual ledger data, not fake demo numbers
it counts records by month from the blockchain chain
This page is mostly a summary dashboard, useful for operations and presentation.

Add Record Page
File: frontend/src/pages/AddRecord.jsx

Purpose:

create a new patient record
What it collects:

name
age
gender
disease
optional medical file name
What happens on submit:

the frontend generates a patient ID
the data is sent to the backend using POST /block
the backend creates a new block
the chain is refreshed on the frontend
What is stored:

patient details
diagnosis
treatment placeholder
doctor placeholder
age
gender
medical file name
Important note:

the file is not uploaded to a server
the UI only stores the file name as demo metadata
Ledger Page
File: frontend/src/pages/Ledger.jsx

Purpose:

view all stored records as blockchain blocks
What it does:

lists patient blocks in a table
supports search by name or patient ID
supports disease filtering
supports date filtering
supports verification status filtering
opens a record detail modal
opens an edit modal
lets you export the record as JSON
This page is the practical “block explorer” for patient data.

Important behaviors:

View details opens frontend/src/components/RecordDetailModal.jsx
Edit record opens frontend/src/components/EditRecordModal.jsx
editing tries the backend update route first
if needed, it falls back to chain rebuild + ledger import
this keeps hashes consistent after edits
This page is one of the most important for showing the blockchain-backed records in a human-readable format.

Blockchain Validation Page
File: frontend/src/pages/Validate.jsx

Purpose:

prove chain integrity
Current simplified layout:

top: chain flow
middle: one block example
bottom: validation result
What it demonstrates:

blocks are linked with hashes
tampering breaks the chain
SHA-256 is used to verify integrity
There is also a Tamper Block #2 demo button on the page for quick visual proof.

Backend validation comes from:

GET /validate
This page is the core of the blockchain explanation in viva or demo.

Tamper Page
File: frontend/src/pages/Tamper.jsx

Purpose:

simulate an attack by changing record data without rehashing
What it does:

lets you pick a non-genesis block
lets you edit fields like patient ID, name, diagnosis, treatment, and doctor
saves the modified patient data without recalculating the hash
Result:

the chain becomes invalid
validation later shows the tampered block
This is the strongest “attack simulation” page in the project.

Reports Page
File: frontend/src/pages/Reports.jsx

Purpose:

show ledger activity and sharing features
What it includes:

a basic growth chart
validation history
tampering count
export/import controls for the ledger JSON
Why it matters:

it supports the idea of decentralized ledger exchange between nodes
you can export from one instance and import into another
The imported ledger is validated by the backend before saving.

Settings Page
File: frontend/src/pages/Settings.jsx

Purpose:

manage local profile data and logout
What it does:

lets the user update name, email, and role
stores profile in browser localStorage
lets the user log out
The header now shows only a profile icon and the user name, which keeps the page cleaner.

11. Shared UI components

These components support the pages:

frontend/src/components/Navbar.jsx
frontend/src/components/Layout.jsx
frontend/src/components/ToastViewport.jsx
frontend/src/components/LoadingSpinner.jsx
frontend/src/components/RecordDetailModal.jsx
frontend/src/components/EditRecordModal.jsx
The left sidebar was removed from the shell, and Settings was moved into the top nav.

12. Important blockchain behaviors

The ledger supports:

adding a new block
validating all blocks
tampering a block for demo
updating a patient record while preserving hash chain consistency
importing/exporting the ledger
When a patient record is edited, the backend:

updates that block’s patient data
recalculates hashes from that block onward
persists the full chain again
That logic lives in Backend/app/services/blockchain.py.

13. What is actually stored

The project stores:

patient ID
name
age
gender
diagnosis
treatment
doctor name
medical file name
block metadata like timestamp and hashes
The ledger itself is stored as JSON on disk using Backend/app/services/storage_service.py.

14. What is not real production behavior

This is important for clarity:

accounts are browser-local only
no real user database exists
no real medical file upload is implemented
no real encryption at rest is implemented
this is a demo blockchain integrity system, not a clinical production system
