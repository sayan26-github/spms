Listed directory spms
Listed directory backend
Listed directory frontend
Viewed package.json:1-39

To run this project (which consists of a Django backend and a React/Vite frontend) in VS Code on Windows, you will need to open the project and run both parts simultaneously using VS Code's integrated terminal. 

Here are the step-by-step instructions:

### 1. Open the Project in VS Code
1. Open VS Code.
2. Go to **File > Open Folder...**
3. Select your project root folder: `c:\Users\Sayan\Documents\spms`.

### 2. Open Two Terminal Windows
You will need two separate terminal instances to run the backend and frontend at the same time.
1. Open the integrated terminal by going to **View > Terminal** (or pressing `` Ctrl + ` ``).
2. Look at the top right of the terminal panel and click the **`+`** icon (or press `` Ctrl + Shift + ` ``) to open a second terminal tab.

### 3. Start the Backend (Django)
In your **first** terminal tab, do the following:
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the Python virtual environment. (I see a `venv` folder inside your backend directory):
   ```bash
   venv\Scripts\activate
   ```
   *(You should see `(venv)` appear at the start of your terminal prompt).*
3. Install the required Python packages (only necessary if you haven't installed them yet):
   ```bash
   pip install -r requirements.txt
   ```
4. Start the Django development server:
   ```bash
   python manage.py runserver
   ```
   *(The backend API will now be running, typically at `http://localhost:8000`)*

### 4. Start the Frontend (React / Vite)
Switch to your **second** terminal tab and do the following:
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the Node modules (only necessary if you haven't installed them yet):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

### 5. View the App
Once both servers are running, the Vite terminal will provide you with a local URL (usually `http://localhost:5173`). Ctrl-click that link in the terminal or open it in your web browser to see the frontend of your application.