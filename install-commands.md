# Complete setup sequence for VS Code terminal:

# 1. Clean everything (run these one by one)
rm -rf node_modules
rm -rf .next
rm -f package-lock.json

# 2. Clear npm cache
npm cache clean --force

# 3. Install dependencies (use legacy peer deps to resolve conflicts)
npm install --legacy-peer-deps

# 4. Run the development server (NOT npm start)
npm run dev

# Alternative if you're on Windows and rm doesn't work:
# Delete these folders/files manually:
# - node_modules folder
# - .next folder  
# - package-lock.json file
# Then run: npm cache clean --force
# Then run: npm install --legacy-peer-deps
# Then run: npm run dev
