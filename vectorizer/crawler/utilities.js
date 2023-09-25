import { readdirSync, statSync, readFileSync } from 'fs';
import path from 'path';

function getDirectories(path) {
  const baseDirectory = path;
  const items = readdirSync(baseDirectory);

  const directories = items.filter(item => {
    const itemPath = `${baseDirectory}/${item}`;
    return statSync(itemPath).isDirectory();
  });

  return directories;
}

function getPagesInADirectory(directory) {
  let mdxFiles = [];

  function walk(dir) {
    const files = readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = statSync(filePath);

      if (stat.isDirectory()) {
        walk(filePath);
      } else if (path.extname(file) === '.mdx') {
        mdxFiles.push(filePath);
      }
    }
  }

  walk(directory);

  return mdxFiles;
}

function getTextFromAPage(fileName) {
  const content = readFileSync(fileName, 'utf8');
  return content;
}

function getKeyWordsFromAPage(fileContent) {
  const keyWords = [];
  const lines = fileContent.split('\n');
  let isKeywordSection = false;

  for (const line of lines) {
    if (isKeywordSection) {
      if (line.trim().startsWith('-')) {
        const keyword = line.replace(/^-/, '').trim();
        keyWords.push(keyword);
      } else {
        break;
      }
    } else if (line.trim().startsWith('keywords:')) {
      isKeywordSection = true;
    }
  }

  return keyWords;
}

function removeFrontMatterFromAPage(fileContent) {
  const frontMatterRegex = /^---([\s\S]*?)---/;
  return fileContent.replace(frontMatterRegex, '');
}

function getTitleFromAPage(fileContent) {
  const lines = fileContent.split('\n');
  let title = '';
  for (const line of lines) {
    if (line.trim().startsWith('#')) {
      title = line.replace(/^#/, '').trim();
      break;
    }
  }
  return title;
}

function pruneDocsFromPath(path) {
  const pathParts = path.split('/');
  const prunedPathParts = pathParts.slice(3);
  let prunedPath = prunedPathParts.join('/');
  prunedPath = prunedPath.replace(/\.mdx$/, '/');
  return prunedPath;
}

async function shapeData(page) {
  const details = {
    title: '',
    keyWords: [],
    text: '',
  };
  const rawContent = getTextFromAPage(page);
  details.title = getTitleFromAPage(rawContent);
  details.keyWords = getKeyWordsFromAPage(rawContent);
  details.text = removeFrontMatterFromAPage(rawContent);
  details.path = pruneDocsFromPath(page);
  return details;
}

export {
  getDirectories,
  getPagesInADirectory,
  getKeyWordsFromAPage,
  getTextFromAPage,
  removeFrontMatterFromAPage,
  getTitleFromAPage,
  shapeData,
};
