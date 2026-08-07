# Ajay Brand Website

A static digital-studio homepage for Ajaysinh Barad.



## Can you preview directly from GitHub?

Yes, but only after GitHub Pages is turned on for this repository. GitHub does not automatically show `index.html` as a live website just because the file is in the repository.

### Turn on GitHub Pages

1. Open the repository on GitHub.
2. Click **Settings**.
3. In the left sidebar, click **Pages**.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Under **Branch**, choose the branch that contains the website, usually `main`.
6. Choose the root folder, shown as `/root`, then click **Save**.
7. Wait a minute or two. GitHub will show a public website link on the same **Pages** screen.

After GitHub Pages is enabled, the site will usually be available at a link like this:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```

Use GitHub Pages when you want to preview or share the website without downloading the project to your computer.

## If the project is on GitHub

If you are looking at this project on GitHub, the folder is not on your computer yet. Choose one of these options first.

### Option A: Download the project without Git

1. Open the GitHub repository page in your browser.
2. Click the green **Code** button.
3. Click **Download ZIP**.
4. Unzip the downloaded file.
5. Open the unzipped folder.
6. Double-click `index.html` to preview the website.

### Option B: Open the project with GitHub Desktop

1. Install **GitHub Desktop** if you do not already have it.
2. On the GitHub repository page, click the green **Code** button.
3. Click **Open with GitHub Desktop**.
4. After it downloads, click **Repository** in the top menu.
5. Click **Open in Terminal**.
6. Run `python3 -m http.server 4173`, then open `http://localhost:4173` in your browser.

### Option C: Clone with Terminal

If you already know how to use Terminal, copy the repository URL from GitHub's green **Code** button, then run:

```bash
git clone REPOSITORY_URL
cd REPOSITORY_FOLDER_NAME
python3 -m http.server 4173
```

Then open this in your browser:

```text
http://localhost:4173
```

## How to preview the website

You do not open the terminal from ChatGPT. The terminal is an app on your computer. If you only want a quick preview, you can skip the terminal completely and double-click `index.html`.

You do not need to be a developer to preview this project locally. Follow these steps:

1. Open the project folder on your computer.
2. Double-click `index.html` to open it in your browser.
3. If you want the closest website-like preview, use the local server option below.

### Local server preview

This option makes your computer act like a tiny website server so the preview feels closer to a real website.

#### How to open a terminal in the project folder

**On Mac:**

1. Open the folder that contains this website.
2. Right-click inside the folder.
3. Choose **New Terminal at Folder**.
4. If you do not see that option, open the **Terminal** app, type `cd ` with a space after it, drag the project folder into the Terminal window, then press **Enter**.

**On Windows:**

1. Open the folder that contains this website.
2. Click the address bar at the top of File Explorer.
3. Type `cmd` and press **Enter**.
4. A Command Prompt window should open already inside the project folder.

If Python is installed, run this command in that terminal window:

```bash
python3 -m http.server 4173
```

Then open this address in your browser:

```text
http://localhost:4173
```

To stop the preview server, go back to the terminal and press `Control + C`.

### Quick file guide

- `index.html` controls the page content and structure.
- `styles.css` controls the visual design, layout, and animations.
- `script.js` controls interactive effects like scroll reveals, cursor behavior, and parallax movement.
