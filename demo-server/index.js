const express = require('express');
const path = require('path');
const fs = require('fs-extra');
const chokidar = require('chokidar');

const app = express();
const port = process.env.PORT || 3000;

const sourceDir = path.join(__dirname, '..', 'platform', 'viewer', 'dist');
const destinationDir = path.join(__dirname, 'public');

const copyFiles = () => {
  if (!fs.existsSync(sourceDir) || fs.readdirSync(sourceDir).length === 0) {
    console.error(`Source directory '${sourceDir}' doesn't exist or is empty. Run build script first.`);
    return;
  }

  fs.copy(sourceDir, destinationDir)
    .then(() => {
      console.log('Copied viewer/dist to public folder.');
    })
    .catch(err => {
      console.error('Error copying files:', err);
    });
};

if (!fs.existsSync(destinationDir)) {
  fs.mkdirSync(destinationDir, { recursive: true });
}

copyFiles();

const watcher = chokidar.watch(sourceDir, { persistent: true });

watcher
  .on('change', () => {
    copyFiles();
  })
  .on('error', error => {
    console.error('Error watching files:', error);
  });

app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader(
    'Cache-Control',
    'no-store, no-cache, must-revalidate, max-age=0'
  );

  next();
});

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
