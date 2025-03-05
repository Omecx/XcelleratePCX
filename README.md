# XcelleratePCX 

A modern e-commerce platform built with React, featuring a robust API integration and optimized performance.

## Features

- 🛍️ Product browsing and search
- 👤 User authentication and profiles
- 🛒 Shopping cart functionality
- 💳 Secure checkout process
- 📱 Responsive design
- 🔍 Advanced search and filtering
- ⚡ Optimized performance
- 🔒 Secure API integration
- 📊 Analytics integration
- 🎨 Modern UI/UX

## Project Overview

XcelleratePCX consists of two main components:
- Frontend (React)
- Backend (Django)

Below are the setup instructions for both parts.

---

# Frontend Setup (front_pcx)

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Modern web browser

## Installation

1. Clone the repository:
   Use the first line when forked the repo
```bash
git clone https://github.com/yourusername/XcelleratePCX.git
# or
git clone https://github.com/Omecx/XcelleratePCX.git
cd XcelleratePCX/front_pcx
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env
```
Edit the `.env` file with your configuration values.

## Development

Start the development server:
```bash
npm start
# or
yarn start
```

The application will be available at `http://localhost:3000`.

## Building for Production

Create a production build:
```bash
npm run build
# or
yarn build
```

## Project Structure

```
front_pcx/
├── public/              # Static files
├── src/
│   ├── components/     # React components
│   ├── contexts/       # React contexts
│   ├── services/       # API services
│   ├── utils/          # Utility functions
│   ├── config.js       # Configuration
│   └── App.js          # Root component
├── .env.example        # Example environment variables
├── .gitignore         # Git ignore rules
└── package.json       # Project dependencies
```

## Environment Variables

Required environment variables:

- `REACT_APP_API_BASE_URL`: Base URL for API endpoints
- `REACT_APP_AUTH_TOKEN_KEY`: Key for storing auth token
- `REACT_APP_USER_INFO_KEY`: Key for storing user info

Optional environment variables:

- `REACT_APP_API_TIMEOUT`: API request timeout (default: 30000)
- `REACT_APP_CACHE_DURATION_*`: Cache duration settings
- `REACT_APP_ANALYTICS_ID`: Analytics tracking ID
- `REACT_APP_ENABLE_*`: Feature flags

---

# Backend Setup (back_pcx)

## Prerequisites

- Python 3.8+
- PostgreSQL

## Setup Steps

1. Navigate to the project folder:
```bash
cd XcelleratePCX
```

2. Create a virtual environment:
```bash
python -m venv env
```

3. Activate the virtual environment:
   - Windows:
     ```bash
     env\Scripts\activate
     ```
   - Linux/Mac:
     ```bash
     source env/bin/activate
     ```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Setup environment variables:
```bash
cd back_pcx
cp back_pcx/.env.example back_pcx/.env
```
Edit the `.env` file with your database credentials and other settings.

6. Apply migrations:
```bash
python manage.py migrate
```

7. Create a superuser:
```bash
python manage.py createsuperuser
```

8. Run the development server:
```bash
python manage.py runserver
```

## API Endpoints

The backend will be available at `http://localhost:8000/`

- Admin panel: `/admin/`
- API: `/api/`
  - Products: `/api/products/`
  - Categories: `/api/categories/`
  - Authentication: `/api/token/`

## Common Issues

- **Database connection errors**: Ensure PostgreSQL is running and credentials are correct
- **Module not found errors**: Check that all dependencies are installed
- **Migration errors**: Try `python manage.py makemigrations` before migrating

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- All API endpoints are secured with JWT authentication
- Sensitive data is stored in environment variables
- API keys and secrets are never committed to the repository
- Regular security audits are performed

## Performance Optimization

[- Implemented request caching]:#
[- Optimized bundle size]:#
[- Lazy loading of components]:#
[- Efficient state management]:#
[- Optimized API calls]:#

## License

[This project is licensed under the MIT License - see the LICENSE file for details.]:#

## Support

For support, please create an issue in the repository.
