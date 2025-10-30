# Code Style & Conventions - SAB Lanyard

## General Principles
1. **ASCII Only**: No Unicode emoji in source code/comments (per universal instructions)
2. **No Magic Numbers**: Use constants for all hardcoded values
3. **Meaningful Names**: Descriptive function/variable names (no "fix", "fallback", "simple", etc.)
4. **Clean Code**: No unused imports, variables, or dead code
5. **Comments**: Explain WHY, not WHAT - avoid obvious comments

## JavaScript/TypeScript Standards

### File Structure
```javascript
// External imports
import express from 'express';

// Internal imports
import { helper } from './utils/helpers';

// Constants (uppercase with underscores)
const MAX_RETRIES = 3;
const DEFAULT_PORT = 5000;

// Implementation
```

### Naming Conventions
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `API_ENDPOINT`)
- **Functions**: `camelCase` (e.g., `getUserData`, `processOrder`)
- **Classes**: `PascalCase` (e.g., `UserService`, `OrderModel`)
- **Files**: `camelCase.js` or `PascalCase.js` for classes/models
- **Private functions**: Prefix with `_` (e.g., `_validateInput`)

### MongoDB/Mongoose Patterns
```javascript
// Model names: PascalCase singular (User, Order, Product)
const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  role: { type: String, enum: ['admin', 'seller'], default: 'seller' }
});

// Always use async/await for database operations
async function getUser(id) {
  const user = await User.findById(id);
  if (!user) {
    throw new Error('User not found');
  }
  return user;
}
```

### Error Handling
```javascript
// Use explicit error throwing, no silent failures
if (!data) {
  throw new Error('Data is required');
}

// Express error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message });
});
```

### React Patterns
```javascript
// Functional components with hooks
import { useState, useEffect } from 'react';

function ProductCard({ product }) {
  const [loading, setLoading] = useState(false);
  
  // Meaningful comments only for complex logic
  useEffect(() => {
    // Fetch product details on mount
    fetchProductDetails();
  }, [product.id]);
  
  return <div>{product.name}</div>;
}
```

## API Route Structure
```javascript
// routes/products.js
router.get('/', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## Environment Variables
- Backend: `backend/.env`
- Frontend: `frontend/.env`
- Always use `.env.example` as template
- Access via `process.env.VARIABLE_NAME`

## Testing
- Backend: Jest + Supertest
- Frontend: React Testing Library
- Test files: `*.test.js` or `*.spec.js`
