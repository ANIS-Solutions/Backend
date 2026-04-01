![](./_assets/anisBackend-asset.jpg)

# ANIS Backend

Backend service for ANIS - a parental control and child care monitoring system.
This API powers user management, app restrictions, quests, behavior analysis, and location tracking.

## Tech Stack

<!-- Get colors & icons : https://simpleicons.org/ -->
<!-- Get colors & icons : https://icon-sets.iconify.design/ -->

![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?logo=express&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?logo=mongoose&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2CA5E0?logo=docker&logoColor=white)
![Docker-Compose](https://img.shields.io/badge/Docker%20Compose-2496ED?logo=docker&logoColor=white)
![Zod](https://img.shields.io/badge/Zod-3068B7?logo=zod&logoColor=white)
![Nodemailer](https://img.shields.io/badge/Nodemailer-22B573?logo=nodemailer&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/prettier-1A2C34?logo=prettier&logoColor=white)
![Jest](https://img.shields.io/badge/jest-C21325?logo=jest&logoColor=white)
![Commitlint](https://img.shields.io/badge/Commitlint-000000?logo=commitlint&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?logo=jsonwebtokens&logoColor=white)
![PNPM](https://img.shields.io/badge/pnpm-F69220?logo=pnpm&logoColor=white)
![Postman](https://img.shields.io/badge/postman-FF6C37?logo=postman&logoColor=white)

---

## Getting Started

1. Clone the repository:

```bash
git clone https://github.com/3bbaas/anis-backend.git
cd anis-backend
```

2. Use the correct Node version from `.nvmrc`:

```bash
nvm use
```

3. Install dependencies:

```bash
pnpm install
```

4. Copy environment file:

```bash
cp config.env.example config.env
```

Populate your keys (JWT secrets, email config, etc.).

5. Start the development server:

```bash
pnpm dev
```

6. API will run at:

```bash
http://localhost:5000/api/v1
```

---

## Development

```bash
# Start development server
pnpm dev

# Build for production
pnpm build

# Run production server
pnpm start
```

---

## Bug Reports

If you find any issues, please open an Issue in the repository with detailed steps to reproduce the problem.

_Bye! ... Bye!_
