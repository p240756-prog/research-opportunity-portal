# Research Opportunity Portal

An individual Computer Networks assignment by **MUHAMMAD FASEEH**, **P24_0756**, **BAI 5A**. Faculty can create, list, view, edit, close/reopen, and delete research opportunities. Every operation uses a Python REST API and MySQL; React contains no preloaded opportunity records.

**GitHub repository:** https://github.com/p240756-prog/research-opportunity-portal

## Dependencies

- Python 3.10 or newer
- MySQL Server 8.0.16 or newer, running locally, plus MySQL CLI or Workbench
- Node.js 22.12 or newer (or Node.js 20.19+) and npm
- Postman for the required API demonstration

Python packages are pinned in `backend/requirements.txt`. React and Vite dependencies are pinned in `frontend/package.json` and `frontend/package-lock.json`.

## Project files

```text
research-opportunity-portal/
  backend/
    app.py                 Flask routes, JSON responses, error handling
    database.py            Environment-based MySQL connection
    validation.py          Required field, type, length and date validation
    requirements.txt       Python dependencies
  database/
    schema.sql             Database and opportunities table
  frontend/
    src/                   React components, API client and styles
    index.html
    package.json
    package-lock.json
    vite.config.js         React tooling and /api development proxy
  postman/
    Research-Opportunity-Portal.postman_collection.json
  .gitignore
  README.md
```

## Setup and run (Windows PowerShell)

Extract the ZIP, open a terminal inside `research-opportunity-portal`, and keep MySQL running. Run the following commands from this project directory.

### 1. Create the database

Open the MySQL command-line client:

```powershell
mysql -u root -p
```

Enter your own local MySQL password when prompted. In the MySQL prompt, execute:

```sql
SOURCE database/schema.sql;
SHOW TABLES FROM research_portal;
exit;
```

If `mysql` is not on PATH, use the MySQL Command Line Client shortcut or open `database/schema.sql` in MySQL Workbench and execute the whole file. The schema creates an empty database and table; it does not insert sample opportunities or delete existing data.

### 2. Configure the backend privately

Create `backend/.env` locally with these settings. Replace the password value with your own password and adjust the user/port to match your MySQL installation.

```dotenv
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=replace_with_your_local_mysql_password
DB_NAME=research_portal
PORT=5000
```

The database account needs SELECT, INSERT, UPDATE, and DELETE on `research_portal.opportunities`. The account importing the schema also needs CREATE permission. Do not commit `.env`, passwords, database dumps containing private data, or access tokens. `.env` is intentionally excluded from Git and the submission ZIP; no `.env.example` is needed.

### 3. Install and start Python

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements.txt
.\.venv\Scripts\python.exe backend\app.py
```

Keep this terminal open. Check http://127.0.0.1:5000/api/health; it should return `{"database":"connected","status":"ok"}`.

On macOS/Linux, use `python3 -m venv .venv`, `.venv/bin/python -m pip install -r backend/requirements.txt`, and `.venv/bin/python backend/app.py`.

### 4. Install and start React

Open a second terminal in the project directory:

```powershell
cd frontend
npm ci
npm run dev
```

Open **http://127.0.0.1:5173**. Vite forwards `/api` to the Python backend at port 5000. Keep both terminals and MySQL running. The board is initially empty; add opportunities using the form or Postman. Search, status filters, sorting, counts, and cards use records returned by the API.

### Optional: run the built frontend with Python

From `frontend`, run `npm run build`. Then start `backend/app.py` as above and open **http://127.0.0.1:5000**. Flask serves `frontend/dist` and the API together. `npm run preview` only previews static frontend assets; use Flask for the working full stack build.

## REST API

Base URL: `http://127.0.0.1:5000`. POST and PUT require `Content-Type: application/json`.

| Method | Path                     | Success | Purpose                                   |
| ------ | ------------------------ | ------- | ----------------------------------------- |
| GET    | `/api/opportunities`     | 200     | List all database records (JSON array)    |
| GET    | `/api/opportunities/:id` | 200     | Get one complete record                   |
| POST   | `/api/opportunities`     | 201     | Create a record; response includes its ID |
| PUT    | `/api/opportunities/:id` | 200     | Replace all editable fields               |
| DELETE | `/api/opportunities/:id` | 200     | Permanently delete a record               |
| GET    | `/api/health`            | 200     | Check the backend and database connection |

POST/PUT body example (sample input for manual testing):

```json
{
  "title": "Network Traffic Analysis",
  "description": "Study campus network performance and identify congestion patterns.",
  "research_area": "Computer Networks",
  "faculty_name": "Dr. Ayesha Khan",
  "department": "Computer Science",
  "required_skills": "Python, Wireshark, TCP/IP",
  "available_positions": 3,
  "application_deadline": "2027-06-30",
  "status": "Open"
}
```

Use the returned `id` in subsequent URLs. For PUT, send **all nine editable fields**, leaving out `id`, `created_at`, and `updated_at`. Change `status` to `Closed` to close a record, or `Open` to reopen it.

Validation returns **400** for missing/empty text, excessive lengths, unknown fields, malformed JSON, a non-object body, invalid calendar dates, status other than Open/Closed, or positions that are not an integer from 1 to 1000. Missing IDs return **404**, including after deletion. Database/server failures return **500** with a readable JSON message. Dates use `YYYY-MM-DD`; positions must be a JSON number. Past deadlines are allowed so historical records can be maintained. SQL values are parameterized.

## Test the assignment in Postman

1. Start MySQL and Python. Open Postman, choose **Import**, and select `postman/Research-Opportunity-Portal.postman_collection.json`.
2. Open the collection's **Variables** tab. Its `baseUrl` is `http://127.0.0.1:5000`; change it only if your backend address differs. No credentials or separate Postman environment are required.
3. Run requests in their numbered order, or use **Run collection** with **one iteration**. Leave the supplied bodies and scripts in place for the first run. The three POST responses save their database IDs in collection variables automatically.
4. The requests create **three** opportunities, retrieve all, retrieve one, update one, close it, delete the third, request the deleted ID for **404**, and send missing/invalid data for **400**. Each includes assertions shown in **Test Results**.
5. The last two requests clean up only the first and second records created by this run. Skip those two if you want to keep the demonstration records on the frontend. Avoid running several collection runners simultaneously because they share the ID variables.
6. Refresh React to see Postman changes. Also create, view, edit, close/reopen, and delete a record using the web interface. Refresh the page to confirm that saved changes remain in MySQL.

For manual Postman requests, select **Body → raw → JSON**, paste the example above, and use the API table. To demonstrate validation, omit `title` or set `available_positions` to `0`. To demonstrate 404, delete an ID and GET that exact ID again.

### What to export from Postman

Export the **collection as JSON**, keeping its requests, bodies, variables, and test scripts. If your Postman version offers a format choice, select **Collection v2.1**. Save it as `Research-Opportunity-Portal.postman_collection.json` under `postman/`. This file is already supplied in v2.1 format and is the required export. In current Postman, use the collection's `…` menu → **More → Export collection → Export JSON**; older versions may offer Export directly. Reset generated ID variables before exporting if they contain values from your run. Do not export passwords, tokens, account settings, screenshots, or an entire workspace. A Runner results export is optional evidence and is not required in this ZIP.

Official reference: https://learning.postman.com/docs/getting-started/importing-and-exporting/exporting-data/

## Troubleshooting

- **500 / database operation failed:** verify MySQL is running, import the schema, and check `backend/.env` host, port, account, password, database name, and permissions. Restart Python after configuration changes.
- **Cannot reach the server:** start Python on port 5000 and React on port 5173. If changing Python's port, also update `frontend/vite.config.js` and Postman's `baseUrl`.
- **Port already in use:** stop the process using 5000 or 5173 before starting another copy.
- **PowerShell does not run npm.ps1:** use `npm.cmd ci` and `npm.cmd run dev`.
- **Empty board:** this is expected before creating database records. No sample records are hard-coded or automatically inserted.

## Validation completed

- React production build passed.
- The supplied Postman collection passed all 12 requests and 34 assertions against MySQL.
- 36 additional API checks passed, including validation boundaries, unchanged updates, Unicode, literal SQL-like input, direct MySQL persistence, and deleted-ID responses.
- A separate failing-database check confirmed a sanitized JSON HTTP 500 response.
- Browser create, complete details, edit, close/reopen, delete, required-field errors, search, and status filters passed. Saved changes survived page refresh and Python restart. Desktop and mobile DOM layouts had no horizontal overflow; the mobile layout was visually inspected.

Validation harnesses and results are stored outside the submitted source and are not included in GitHub or the ZIP.

## Submission contents

Required filename: **`P24_0756_MUHAMMAD_FASEEH_BAI_5A.zip`**.

The ZIP contains frontend/backend source, dependency files, SQL schema, the Postman collection, and this README with the repository link. Installed dependencies, build output, local credentials, screenshots, validation scripts, and test-result files are excluded. No `docs` folder is needed.

**One-minute demonstration video: pending.** Add your own `demonstration.mp4` to the final ZIP or replace this sentence with an instructor-accessible video link before submission. The video should show web CRUD and the required Postman responses. No video has been generated because video instructions were deferred.

Development phases are recorded as separate Git commits: removal of the prior implementation, Python/MySQL API, React frontend, Postman collection, setup instructions, and any fixes found during validation.
