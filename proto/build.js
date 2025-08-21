const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Ensure generated directory exists
const generatedDir = './generated';
if (!fs.existsSync(generatedDir)) {
  fs.mkdirSync(generatedDir, { recursive: true });
}

console.log('Building Protocol Buffers for JavaScript...');

// Check if protoc is available
function checkProtoc() {
  try {
    execSync('protoc --version', { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

try {
  // Check for protoc
  if (!checkProtoc()) {
    console.error('❌ protoc compiler not found');
    console.log('\n📋 Please install protoc:');
    console.log('Windows: Download from https://github.com/protocolbuffers/protobuf/releases');
    console.log('macOS: brew install protobuf');
    console.log('Linux: sudo apt-get install protobuf-compiler');
    process.exit(1);
  }

  console.log('✅ protoc compiler found');

  // Build JavaScript files
  console.log('Generating JavaScript files...');
  execSync('protoc --js_out=./generated --js_opt=import_style=commonjs *.proto', { 
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('✅ JavaScript protobuf files generated successfully!');
  
  // List generated files
  const generatedFiles = fs.readdirSync(generatedDir).filter(file => file.endsWith('.js'));
  console.log('\nGenerated files:');
  generatedFiles.forEach(file => console.log(`  - ${file}`));
  
  // Create index.js for easy importing
  createIndexFile(generatedFiles);
  
} catch (error) {
  console.error('❌ Error building protobufs:', error.message);
  process.exit(1);
}

function createIndexFile(generatedFiles) {
  const indexContent = `// Auto-generated index file for Protocol Buffer classes
// This file exports all generated protobuf classes for easy importing

${generatedFiles.map(file => {
  const className = file.replace('.js', '').replace('_pb', '');
  return `const ${className} = require('./${file}');`;
}).join('\n')}

module.exports = {
${generatedFiles.map(file => {
  const className = file.replace('.js', '').replace('_pb', '');
  return `  ${className}`;
}).join(',\n')}
};
`;

  fs.writeFileSync(path.join(generatedDir, 'index.js'), indexContent);
  console.log('✅ Index file created for easy importing');
}
