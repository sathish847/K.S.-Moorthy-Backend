# Maheesh Portfolio Backend

A MERN stack backend application built with Express.js and MongoDB Atlas.

## Features

- User authentication (register, login, JWT tokens)
- Password hashing with bcrypt
- Input validation with express-validator
- CORS support
- Environment-based configuration
- Modular architecture (routes, models, middleware)

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Express Validator
- **Password Hashing**: bcryptjs

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd maheesh_portfolio_backend
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file in the root directory and add your environment variables:

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb+srv://your-username:your-password@cluster0.mongodb.net/maheesh_portfolio?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production
CLIENT_URL=http://localhost:3000
```

4. Start the development server

```bash
npm run dev
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication Routes

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected route)

### Request Examples

#### Register User

```bash
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

#### Login User

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

#### Get Current User (Protected)

```bash
GET /api/auth/me
Authorization: Bearer <jwt-token>
```

## Project Structure

```
maheesh_portfolio_backend/
├── config/
│   └── database.js          # Database connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── models/
│   └── User.js              # User model
├── routes/
│   └── auth.js              # Authentication routes
├── .env                     # Environment variables
├── .gitignore              # Git ignore file
├── package.json            # Dependencies and scripts
├── README.md               # Project documentation
└── server.js               # Main server file
```

## Environment Variables

| Variable      | Description                     | Default                                     |
| ------------- | ------------------------------- | ------------------------------------------- |
| `NODE_ENV`    | Environment mode                | development                                 |
| `PORT`        | Server port                     | 5000                                        |
| `MONGODB_URI` | MongoDB Atlas connection string | mongodb://localhost:27017/maheesh_portfolio |
| `JWT_SECRET`  | JWT secret key                  | (required)                                  |
| `CLIENT_URL`  | Frontend URL for CORS           | http://localhost:3000                       |

## Scripts

- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the ISC License.
