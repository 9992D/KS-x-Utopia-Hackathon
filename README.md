# Financial Terminal

A modern financial terminal application built with Next.js and Python backend.

## Project Structure

The project consists of two main components:

- **Frontend**: A Next.js application located in the `financial-terminal` directory
- **Backend**: A Python application located in the `back` directory

## Prerequisites

- Node.js (v18 or higher)
- Python (3.8 or higher)
- Poetry (Python package manager)

## Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd financial-terminal
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd back
   ```

2. Install dependencies using Poetry:
   ```bash
   poetry install
   ```

3. Copy the environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration

5. Start the backend server:
   ```bash
   poetry run python src/main.py
   ```

## Production Deployment

The application is designed to be deployed on AWS infrastructure. The backend server will be hosted on an AWS instance rather than localhost:3000.

### Environment Variables

Make sure to set up the following environment variables in your production environment:

- Frontend:
  - `NEXT_PUBLIC_API_URL`: The URL of your backend API
  - `NEXT_PUBLIC_ENVIRONMENT`: Set to "production"

- Backend:
  - Refer to `.env.example` in the backend directory for required variables

## Features

- Modern UI built with Next.js and Tailwind CSS
- Responsive design
- Real-time data updates
- Secure authentication
- Comprehensive financial data visualization

## Tech Stack

### Frontend
- Next.js 15
- React 19
- Tailwind CSS
- Radix UI components
- Recharts for data visualization
- TypeScript

### Backend
- Python
- Poetry for dependency management
- FastAPI (based on the project structure)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](back/LICENSE) file for details. 