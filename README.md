# NumPal Modular Workspace

This repository has been restructured to facilitate modular development, isolated environments, and automated deployments for both the GitHub Pages frontend and the Google Apps Script backend.

## Architecture & Folder Structure

- `frontend/`: Contains all client-side code.
  - `css/`: Stylesheets.
  - `pages/`: HTML views for the application.
  - `js/`: Modular JavaScript logic.
    - `core/`: Core initialization and configurations (`config.js`, `app.js`).
    - `utils/`: Shared utilities (`ui.js`, `rolodex.js`).
    - `pages/`: Page-specific scripts, directly mapping to HTML views.
- `backend/`: Contains Google Apps Script backend logic.
- `assets/`: Contains images and application icons.
- `.github/workflows/`: Contains GitHub Actions for continuous deployment.

## Environment Management

You can toggle between the 3 environments (Exp, Dev, Prod) by altering the `ENV` constant inside `frontend/js/core/config.js`. 
- **Dev**: Displays a persistent red `Testing` banner.
- **Exp**: Displays a persistent purple `Experimentation` banner.
- **Prod**: Operates normally with no banner.

## Automated Backend Deployment (Google Apps Script)

This repository includes a GitHub Action to automatically deploy changes made in the `backend/` folder directly to Google Apps Script using `clasp`.

### Setup Instructions:
1. Ensure you have Node.js installed locally.
2. Install clasp globally: `npm install -g @google/clasp`
3. Login to clasp: `clasp login` (This creates a `~/.clasprc.json` file on your machine).
4. Navigate to the `backend` folder locally and link it to your Apps Script project: `clasp clone <SCRIPT_ID>`
5. Go to your GitHub repository **Settings > Secrets and variables > Actions**.
6. Create a New Repository Secret named `CLASP_CREDENTIALS`. Paste the entire contents of your local `~/.clasprc.json` file into this secret.
7. Future commits to the `main` branch that modify files in the `backend/` directory will now trigger the workflow and automatically push code to Apps Script.