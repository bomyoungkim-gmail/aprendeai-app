
import fs from 'fs';
import path from 'path';

const envPath = path.join('c:', 'projects', 'aprendeai-app', 'services', 'ai', '.env');
try {
  let content = fs.readFileSync(envPath, 'utf8');
  if (content.includes('ALLOW_MOCK_LLM=true')) {
    content = content.replace(/ALLOW_MOCK_LLM=true[\r\n]*/g, '');
    fs.writeFileSync(envPath, content);
    console.log('Removed ALLOW_MOCK_LLM=true from .env');
  } else {
    console.log('ALLOW_MOCK_LLM=true not found in .env');
  }
} catch (error) {
  console.error('Error modifying .env:', error);
}
