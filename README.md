# WebAuthn Example

A complete example of WebAuthn implementation with passkey authentication, using React, NestJS, PostgreSQL, and Docker.

## 📋 Table of Contents

- [Features](#-features)
- [Technologies](#-technologies)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [⚠️ Security and Environment Variables](#️-security-and-environment-variables)
- [Usage](#-usage)
- [Understanding WebAuthn: Flows and Challenges](#-understanding-webauthn-flows-and-challenges)
- [Project Structure](#-project-structure)
- [API Endpoints](#-api-endpoints)
- [Configuration](#-configuration)
- [Development](#-development)
- [Production](#-production)
- [Troubleshooting](#-troubleshooting)
- [License](#-license)

## ✨ Features

### Traditional Authentication
- ✅ **Registration** with email, password, first name, and last name
- ✅ **Login** with email and password
- ✅ Data validation with class-validator

### WebAuthn Authentication
- ✅ **Add passkeys** from the dashboard
- ✅ **Login with passkey** from the login page
- ✅ **Test authentication** from the dashboard
- ✅ **Passkey management**: view and delete
- ✅ Automatic device type detection (iOS, Android, Desktop)

### User Interface
- ✅ Modern interface with **Tailwind CSS** and **Shadcn UI**
- ✅ Responsive design
- ✅ Error handling and user feedback
- ✅ Loading states

## 🛠 Technologies

### Frontend
- **React 18** - UI library
- **TypeScript** - Static typing
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Shadcn UI** - Accessible UI components
- **React Router** - Routing
- **@simplewebauthn/browser** - WebAuthn client

### Backend
- **NestJS** - Node.js framework
- **TypeScript** - Static typing
- **TypeORM** - ORM for PostgreSQL
- **PostgreSQL** - Relational database
- **@simplewebauthn/server** - WebAuthn server
- **bcrypt** - Password hashing
- **class-validator** - DTO validation

### Infrastructure
- **Docker** & **Docker Compose** - Containerization
- **PostgreSQL 15** - Database
- **Redis** - Challenge storage with TTL

## 📦 Prerequisites

- **Docker** (version 20.10+) and **Docker Compose** (version 2.0+)
- **Node.js** 20+ (for local development)
- **npm** or **yarn**

## 🚀 Installation

### Option 1: With Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/VGontier-cmd/webbauthn-example.git
   cd webbauthn-example
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

   This command will:
   - Build Docker images
   - Start PostgreSQL
   - Start Redis
   - Start the NestJS backend
   - Start the React frontend

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - PostgreSQL: localhost:5432
   - Redis: localhost:6379

### Option 2: Local Development

#### PostgreSQL Database

Make sure you have PostgreSQL installed and running, or use Docker only for the database:

```bash
docker-compose up postgres redis -d
```

#### Backend

```bash
cd backend
npm install
npm run start:dev
```

The backend will be available at http://localhost:3001

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at http://localhost:5173

## ⚠️ Security and Environment Variables

### ⚠️ **IMPORTANT: Read before forking or deploying**

This project uses **hardcoded environment variables** in `docker-compose.yml` to simplify the example. **This is NOT secure for production.**

**For production use, you MUST:**

1. **Create a `.env` file** at the project root:
   ```bash
   # .env
   DATABASE_URL=postgresql://user:password@postgres:5432/dbname
   POSTGRES_USER=your_user
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_DB=your_database
   REDIS_URL=redis://redis:6379
   PORT=3001
   ORIGIN=http://localhost:5173
   ```

2. **Add `.env` to `.gitignore`**:
   ```gitignore
   .env
   .env.local
   .env.*.local
   ```

3. **Modify `docker-compose.yml`** to use environment variables:
   ```yaml
   environment:
     DATABASE_URL: ${DATABASE_URL}
     POSTGRES_USER: ${POSTGRES_USER}
     POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
     # etc.
   ```

4. **Create a `.env.example`** (without sensitive values) to document required variables:
   ```bash
   # .env.example
   DATABASE_URL=postgresql://user:password@postgres:5432/dbname
   POSTGRES_USER=example_user
   POSTGRES_PASSWORD=example_password
   POSTGRES_DB=example_db
   REDIS_URL=redis://redis:6379
   PORT=3001
   ORIGIN=http://localhost:5173
   ```

**⚠️ Never commit:**
- Passwords
- Secret keys
- API tokens
- Database URLs with credentials

**🔒 Best practices:**
- Use strong and unique passwords
- Change all default passwords
- Use secrets managers in production (AWS Secrets Manager, HashiCorp Vault, etc.)
- Enable Redis authentication if exposed publicly
- Configure appropriate firewall rules

## 📖 Usage

### 1. Create an account

1. Go to http://localhost:5173
2. Click on "Register"
3. Fill out the form:
   - First name
   - Last name
   - Email
   - Password (minimum 6 characters)
4. Click "Register"

### 2. Login with password

1. On the login page, enter your email and password
2. Click "Login with password"

### 3. Add a passkey

1. Once logged in, you'll be on the dashboard
2. Click "Add a passkey"
3. Follow your browser/device instructions:
   - **Desktop**: Use your password manager or security key
   - **iOS**: Use Face ID or Touch ID
   - **Android**: Use fingerprint or facial unlock
4. The passkey is now registered

### 4. Login with a passkey

1. On the login page, enter your email
2. Click "Login with a passkey"
3. Confirm with your authentication method (Face ID, Touch ID, etc.)
4. You are automatically logged in

### 5. Manage your passkeys

On the dashboard, you can:
- View all your registered passkeys
- Test a passkey with the "Test passkey" button
- Delete a passkey with the delete button

## 🔐 Understanding WebAuthn: Flows and Challenges

### Why store a challenge?

The **challenge** is a crucial element of WebAuthn security. Here's why it must be stored on the server side:

#### 1. **Protection against replay attacks**

Without a challenge, an attacker could:
- Intercept a valid authentication response
- Reuse it later to authenticate as you

**With the challenge**:
- The server generates a unique and random challenge
- The authenticator signs this specific challenge
- The server verifies that the response exactly matches the challenge it generated
- The challenge is deleted after use (one-time use)
- If someone reuses an old response, the challenge won't match anymore → **Failure**

#### 2. **Authenticity verification**

The challenge allows verification that:
- The response comes from the authenticator that owns the private key
- The response hasn't been modified in transit
- The response is recent (thanks to timeout)

#### 3. **Session binding**

The challenge links the authentication request to a specific session:
- Challenge generated → Stored with user ID
- Response received → Verified against stored challenge
- Challenge deleted → Prevents reuse

#### 4. **Timeout and expiration**

In this project, challenges use **two protection mechanisms**:

**Primary protection: One-Time Use (Security)**
- Challenge deleted **immediately** after verification
- Prevents replay attacks
- This is the main security mechanism

**Secondary protection: Temporal expiration (Memory cleanup)**
- Challenge expires after 5 minutes if unused
- Handles abandoned flows (user closes browser, etc.)
- Prevents memory leaks

**Example of blocked attack**:
```
1. Attacker intercepts: { challenge: "ABC123", signature: "xyz..." }
2. Attacker attempts to reuse this response
3. Server generates a NEW challenge: "DEF456"
4. Old signature doesn't match new challenge
5. ❌ Authentication failed
```

**Why 5 minutes?**
- Compromise between security and user experience
- Allows handling network delays
- Industry standard (recommended: 3-10 minutes)

### Passkey registration flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────────┐
│Frontend │         │ Backend │         │Navigator │         │Authenticator│
└────┬────┘         └────┬────┘         └────┬─────┘         └──────┬──────┘
     │                    │                    │                      │
     │ 1. generateOptions│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Get user         │                      │
     │                    │ • Generate challenge│                      │
     │                    │ • Store challenge  │                      │
     │                    │   (reg-{userId})   │                      │
     │                    │ • Exclude existing │                      │
     │                    │   passkeys         │                      │
     │<───────────────────│                    │                      │
     │    options          │                    │                      │
     │  (challenge included)│                    │                      │
     │                    │                    │                      │
     │ 2. startRegistration│                    │                      │
     │─────────────────────┼───────────────────>│                      │
     │                    │                    │ 3. Request confirm.  │
     │                    │                    │    (Touch/Face ID)  │
     │                    │                    │─────────────────────>│
     │                    │                    │                      │
     │                    │                    │ 4. Generate keys    │
     │                    │                    │    Sign challenge   │
     │                    │                    │    Create attestation│
     │                    │                    │<─────────────────────│
     │                    │                    │                      │
     │<────────────────────┼────────────────────│                      │
     │ attestationResponse │                    │                      │
     │  (signature included)│                    │                      │
     │                    │                    │                      │
     │ 5. verifyRegistration│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Get challenge    │                      │
     │                    │ • Verify challenge │                      │
     │                    │ • Verify signature │                      │
     │                    │ • Verify origin    │                      │
     │                    │ • Extract pub. key│                      │
     │                    │ • Save passkey     │                      │
     │                    │ • Delete challenge│                      │
     │<───────────────────│                    │                      │
     │    success          │                    │                      │
```

**Detailed steps**:

1. **Options generation**:
   - The backend generates a unique random challenge
   - The challenge is stored in Redis with key `reg-{userId}`
   - Options include the challenge, user ID, domain, etc.

2. **Browser interaction**:
   - The browser requests user confirmation
   - The authenticator generates a key pair (private/public)
   - The private key stays in the authenticator (never exposed)
   - The authenticator signs the challenge with the private key

3. **Verification**:
   - The backend retrieves the stored challenge
   - Verifies that the signature matches the challenge
   - If valid, saves the public key and deletes the challenge

### Passkey authentication flow

```
┌─────────┐         ┌─────────┐         ┌──────────┐         ┌─────────────┐
│Frontend │         │ Backend │         │Navigator │         │Authenticator│
└────┬────┘         └────┬────┘         └────┬─────┘         └──────┬──────┘
     │                    │                    │                      │
     │ 1. generateOptions │                    │                      │
     │    (email)         │                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Find user        │                      │
     │                    │ • Get passkeys     │                      │
     │                    │ • Generate challenge│                      │
     │                    │ • Store challenge  │                      │
     │                    │   (auth-email-{email})│                    │
     │                    │ • List credential  │                      │
     │                    │   IDs allowed      │                      │
     │<───────────────────│                    │                      │
     │    options          │                    │                      │
     │  (challenge included)│                    │                      │
     │                    │                    │                      │
     │ 2. startAuthentication│                    │                      │
     │─────────────────────┼───────────────────>│                      │
     │                    │                    │ 3. Find passkey      │
     │                    │                    │    by credential ID  │
     │                    │                    │    Request confirm.  │
     │                    │                    │─────────────────────>│
     │                    │                    │                      │
     │                    │                    │ 4. Sign challenge   │
     │                    │                    │    with private key │
     │                    │                    │    Increment counter │
     │                    │                    │<─────────────────────│
     │                    │                    │                      │
     │<────────────────────┼────────────────────│                      │
     │ assertionResponse  │                    │                      │
     │  (signature included)│                    │                      │
     │                    │                    │                      │
     │ 3. verifyLogin      │                    │                      │
     │    (email + response)│                    │                      │
     │───────────────────>│                    │                      │
     │                    │ • Find user        │                      │
     │                    │ • Find passkey     │                      │
     │                    │ • Get challenge    │                      │
     │                    │ • Verify challenge │                      │
     │                    │ • Verify signature │                      │
     │                    │   (with pub. key)  │                      │
     │                    │ • Verify counter  │                      │
     │                    │ • Update counter  │                      │
     │                    │ • Delete challenge │                      │
     │<───────────────────│                    │                      │
     │    user data        │                    │                      │
```

**Detailed steps**:

1. **Options generation**:
   - User enters their email
   - Backend finds user and their passkeys
   - Generates a new unique challenge
   - Stores challenge with key `auth-email-{email}`
   - Returns allowed credential IDs

2. **Browser interaction**:
   - Browser finds corresponding passkey
   - Requests confirmation (Touch ID, Face ID, etc.)
   - Authenticator signs the challenge
   - Increments anti-replay counter

3. **Verification**:
   - Backend retrieves stored challenge
   - Verifies signature with public key
   - Verifies counter has increased
   - Updates counter in database
   - Deletes challenge (one-time use)

### Challenge storage in this project

**Current implementation** (Redis with TTL):
```typescript
// Storage
await this.redisService.setChallenge(
  `reg-${userId}`,
  options.challenge,
  300 // 5 minutes TTL
);

// Retrieval and deletion
const challenge = await this.redisService.getChallenge(key);
await this.redisService.deleteChallenge(key); // One-time use
```

**Advantages**:
- ✅ Automatic expiration via Redis TTL
- ✅ Fast (in-memory)
- ✅ Survives server restarts (with persistence)
- ✅ Works with multiple servers (load balancing)
- ✅ No manual cleanup needed

**Redis TTL mechanism**:
- Challenges automatically expire after 5 minutes
- Prevents memory leaks from abandoned flows
- One-time use: challenge deleted immediately after verification

## 📁 Project Structure

```
webbauthn-example/
├── backend/                    # NestJS API
│   ├── src/
│   │   ├── auth/              # Authentication module
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   └── dto/           # Data Transfer Objects
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── entities/          # TypeORM entities
│   │   │   ├── user.entity.ts
│   │   │   └── credential.entity.ts
│   │   ├── redis/             # Redis service
│   │   │   ├── redis.service.ts
│   │   │   └── redis.module.ts
│   │   ├── app.module.ts
│   │   ├── app.controller.ts
│   │   └── main.ts            # Entry point
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                   # React application
│   ├── src/
│   │   ├── components/         # Shadcn UI components
│   │   │   └── ui/
│   │   │       ├── button.tsx
│   │   │       ├── card.tsx
│   │   │       ├── input.tsx
│   │   │       └── ...
│   │   ├── pages/             # Application pages
│   │   │   ├── Login.tsx
│   │   │   │   ├── EmailStep.tsx
│   │   │   │   ├── PasswordStep.tsx
│   │   │   │   └── PasskeyStep.tsx
│   │   │   ├── Register.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── services/           # API services
│   │   │   └── api.ts
│   │   ├── lib/               # Utilities
│   │   │   └── utils.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
│
├── docker-compose.yml          # Docker configuration
├── .gitignore
└── README.md
```

## 🔌 API Endpoints

### Traditional Authentication

- `POST /auth/register` - Registration
  ```json
  {
    "email": "user@example.com",
    "password": "password123",
    "firstName": "John",
    "lastName": "Doe"
  }
  ```

- `POST /auth/login` - Login
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```

- `GET /auth/user/:userId` - Get user information

### WebAuthn - Registration

- `POST /auth/webauthn/register/options/:userId` - Generate registration options
- `POST /auth/webauthn/register/verify/:userId` - Verify registration
  ```json
  {
    "response": { /* attestationResponse */ },
    "deviceType": "Desktop"
  }
  ```

### WebAuthn - Authentication

- `POST /auth/webauthn/login/options` - Generate login options (by email)
  ```json
  {
    "email": "user@example.com"
  }
  ```

- `POST /auth/webauthn/login/verify` - Verify authentication
  ```json
  {
    "email": "user@example.com",
    "response": { /* assertionResponse */ }
  }
  ```

- `POST /auth/webauthn/authenticate/options/:userId` - Authentication options (from dashboard)
- `POST /auth/webauthn/authenticate/verify/:userId` - Verify authentication

### Passkey Management

- `DELETE /auth/webauthn/credential/:userId/:credentialId` - Delete a passkey

## ⚙️ Configuration

### Environment Variables

#### Backend (`backend/.env` or docker-compose.yml)

```env
DATABASE_URL=postgresql://webauthn:webauthn123@postgres:5432/webauthn_db
PORT=3001
ORIGIN=http://localhost:5173
REDIS_URL=redis://redis:6379
```

#### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3001
```

### WebAuthn Configuration

In `backend/src/auth/auth.service.ts`, you can modify:

```typescript
private rpName = "WebAuthn Example";  // Your application name
private rpID = "localhost";            // Domain (localhost for dev)
private origin = "http://localhost:5173"; // Allowed origin
```

⚠️ **Important**: For production, `rpID` must match your domain (without protocol or port).

## 💻 Development

### Available Scripts

#### Backend

```bash
cd backend
npm run start:dev      # Start in development mode with hot-reload
npm run build          # Compile TypeScript
npm run start:prod     # Start in production mode
npm run lint           # Lint code
npm run test           # Run tests
```

#### Frontend

```bash
cd frontend
npm run dev            # Start development server
npm run build          # Production build
npm run preview        # Preview production build
```

### Hot-reload

With Docker Compose, mounted volumes enable hot-reload:
- Changes in `backend/src/` automatically reload the server
- Changes in `frontend/src/` automatically reload the browser

### Database

To access PostgreSQL via Docker:

```bash
docker exec -it webauthn-postgres psql -U webauthn -d webauthn_db
```

### Redis

To access Redis via Docker:

```bash
docker exec -it webauthn-redis redis-cli
```

## 🚢 Production

### Required Preparations

1. **Domain and HTTPS**
   - WebAuthn requires HTTPS in production (except localhost)
   - Configure a valid SSL certificate
   - Update `rpID` in `auth.service.ts` with your domain

2. **Environment Variables**
   - Create secure `.env` files
   - Use strong passwords for PostgreSQL
   - Configure `ORIGIN` with your production domain

3. **Challenge Management**
   - Redis is already implemented with automatic TTL
   - Challenges expire automatically after 5 minutes
   - One-time use prevents replay attacks

4. **Sessions**
   - Add secure session management (JWT, server sessions)
   - Configure secure cookies (HttpOnly, Secure, SameSite)

5. **Security**
   - Enable CORS with specific origins
   - Implement rate limiting
   - Add security logs
   - Configure security headers (Helmet)

### Production Build

```bash
# Backend
cd backend
npm run build
npm run start:prod

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with a web server (nginx, etc.)
```

## 🐛 Troubleshooting

### Error "database does not exist"

Make sure PostgreSQL is started and the database is created:

```bash
docker-compose up postgres -d
```

### Error "Challenge not found"

Challenges are stored in Redis and expire after 5 minutes. If you wait too long between generating options and verification, you'll need to start over.

### Passkey doesn't work

1. Verify you're using HTTPS (or localhost)
2. Make sure your browser supports WebAuthn
3. Check the browser console for errors
4. Check backend logs

### CORS Error

Verify that `ORIGIN` in the backend matches the frontend URL.

### Port already in use

Modify ports in `docker-compose.yml` if necessary:

```yaml
ports:
  - "3002:3001"  # Backend on port 3002
  - "5174:5173"  # Frontend on port 5174
```

### Redis connection error

Make sure Redis is running:

```bash
docker-compose up redis -d
```

Check Redis connection:

```bash
docker exec -it webauthn-redis redis-cli ping
```

## 📝 Important Notes

- ⚠️ This project is an **educational example**. For production, add:
  - More robust server-side validation
  - Complete error handling
  - Logs and monitoring
  - Unit and integration tests
  - API documentation (Swagger/OpenAPI)

- 🔒 **Security**: Passwords are hashed with bcrypt, but in production, add:
  - Rate limiting
  - CSRF protection
  - Email validation (email verification)
  - Stronger passwords

## 📄 License

MIT License - See the [LICENSE](LICENSE) file for more details.

## 🤝 Contributing

Contributions are welcome! Feel free to open an issue or pull request.

## 📚 Resources

- [WebAuthn Specification](https://www.w3.org/TR/webauthn-2/)
- [SimpleWebAuthn Documentation](https://simplewebauthn.dev/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [React Documentation](https://react.dev/)
- [Shadcn UI](https://ui.shadcn.com/)
