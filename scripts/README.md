# Scripts Directory

This directory contains utility scripts for the ZERA JS SDK development workflow.

## update-test-scripts.js

Automatically discovers modules in the SDK and updates the package.json with module-specific test scripts. This script integrates with the broader testing infrastructure to maintain consistency across all SDK modules.

### Usage

```bash
# Run the script directly
node scripts/update-test-scripts.js

# Or use the npm script
npm run update:test-scripts
```

### What it does

1. **Module Discovery**: Automatically scans the `src/` directory to find all modules
2. **Script Generation**: Creates `test:module-name` scripts for each discovered module
3. **Package.json Updates**: Automatically updates the scripts section in package.json
4. **Integration**: Works seamlessly with the main test runner (`test-runner.js`)

### Integration with Broader Library

The update-test-scripts functionality is deeply integrated with the ZERA JS SDK's testing architecture:

#### **Test Runner Integration**
- Generated scripts work with the main `test-runner.js` file
- Each module gets its own isolated test command: `npm run test:module-name`
- Supports all test runner options: `--watch`, `--coverage`, `--verbose`, etc.

#### **Module Structure Integration**
- Discovers modules based on the SDK's directory structure (`src/module-name/`)
- Automatically handles special cases like the `proto/` directory
- Maintains consistency with the SDK's modular architecture

#### **Development Workflow Integration**
- Integrates with the SDK's development workflow
- Automatically updates when new modules are added
- Ensures all modules have consistent testing capabilities

### Generated Scripts

The script automatically generates test commands for each module:

```json
{
  "scripts": {
    "test:wallet-creation": "node test-runner.js --module=wallet-creation",
    "test:coin-txn": "node test-runner.js --module=coin-txn",
    "test:shared": "node test-runner.js --module=shared",
    "test:api": "node test-runner.js --module=api",
    "test:proto": "node test-runner.js --module=proto"
  }
}
```

### Module Discovery

The script discovers modules by scanning:
- `src/*/` - All subdirectories in src (e.g., `src/wallet-creation/`, `src/coin-txn/`)
- `proto/` - Special handling for the protocol buffer module

### When to Run

Run this script when:
- **Adding new modules** to the SDK
- **Restructuring** the codebase
- **Setting up** a new development environment
- **Ensuring consistency** across test scripts

### Benefits

- **Automation**: No manual script maintenance required
- **Consistency**: All modules follow the same testing pattern
- **Scalability**: Automatically handles new modules as they're added
- **Integration**: Works seamlessly with existing test infrastructure

### Example Output

```
🚀 Test Script Auto-Updater

🔍 Discovering modules...
✅ Found 5 modules:
  📁 wallet-creation
  📁 coin-txn
  📁 shared
  📁 api
  📁 proto

📝 Updating package.json...
  ✨ Added script: test:wallet-creation
  ✨ Added script: test:coin-txn
  ✨ Added script: test:shared
  ✨ Added script: test:api
  ✨ Added script: test:proto

✅ package.json updated successfully!

🎉 Test scripts updated successfully!
💡 You can now run:
  npm run test:wallet-creation
  npm run test:coin-txn
  npm run test:shared
  npm run test:api
  npm run test:proto
```

This script ensures that the ZERA JS SDK maintains a consistent, automated testing infrastructure that scales with the library's growth.
