# Demos

This folder contains comprehensive demonstrations showcasing the full capabilities of the ZERA wallet creation system.

## 📁 Contents

- **`complete-showcase.js`** - Complete implementation demo
  - SLIP-0010 HD Wallet implementation
  - Ed25519 implementation
  - Ed448 implementation
  - BIP44 compliance demonstration
  - Hash algorithms showcase
  - Complete wallet creation workflow
  - Advanced features demonstration

- **`unified-curves.js`** - Unified curves demonstration
  - Shows how Ed25519 and Ed448 work together
  - Demonstrates curve selection and switching
  - Performance comparisons
  - Key generation workflows

- **`enums-showcase.js`** - Enumeration system showcase
  - Key type enums (ED25519, ED448)
  - Hash type enums (SHA3-256, SHA3-512, BLAKE3)
  - Mnemonic length validation
  - Validation function demonstrations

## 🚀 Usage

Run any demo directly:

```bash
# Run complete showcase
node demos/complete-showcase.js

# Run unified curves demo
node demos/unified-curves.js

# Run enums showcase
node demos/enums-showcase.js

# Or from the project root
node src/wallet-creation/demos/complete-showcase.js
```

## 🎯 Purpose

These demos are designed to:
- **Showcase capabilities** to stakeholders or users
- **Demonstrate real-world usage** scenarios
- **Provide comprehensive overview** of the system
- **Serve as educational tools** for learning the API
- **Highlight advanced features** and use cases

## 📚 When to Use

- Presenting to stakeholders or clients
- Teaching new team members
- Documenting system capabilities
- Creating marketing materials
- Understanding advanced features
- Learning complete workflows
