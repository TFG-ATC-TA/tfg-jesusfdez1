> [!NOTE]
> Para leer este documento en español, visita este [archivo](README_ES.md)

# Backend
The backend of Lactokeeper is a robust RESTful API developed with Node.js and Express, designed to manage all server functionalities in the dairy farm management system. This application provides a comprehensive programming interface for the administration of users, farms, equipment, IoT devices, data collection, and notification system.

## Technology Stack

The application is based on a modern technology stack that implements a hybrid architecture for efficient handling of different types of data:

- **Backend**: Node.js + Express.js
- **Databases**:
  - MongoDB (main NoSQL with Mongoose)
  - PostgreSQL (relational data)
  - InfluxDB (IoT sensor time series)
- **Communication**: MQTT (IoT devices) + WebSockets (real-time)
- **Security**: JWT + bcryptjs
- **Logging**: Winston
- **Testing**: Jest
- **Deployment**: Docker

## Project Structure

The backend project is organized following a modular architecture that facilitates code maintenance and scalability:

```
├── app.js              # Main Express configuration
├── bin/                # Server entry point
├── config/             # Configurations (DB, logging)
├── models/             # Mongoose schemas (User, Farm, Equipment, Device, Collection, Notification)
├── routes/             # API endpoints
├── middleware/         # Authentication and validations
├── utils/              # System utilities
├── tests/              # Automated test suite
└── logs/               # Log files
```

## Installation and Setup

### System Prerequisites

The application requires Node.js version 16 or higher as the main runtime environment. For data storage, MongoDB, PostgreSQL, and InfluxDB must be running and accessible.

### Installation Process

Start by downloading all dependencies using `npm install`. Once package installation is complete, configure and verify the correct operation of MongoDB, PostgreSQL, and InfluxDB databases, ensuring all are up and accessible.

## Available Scripts

```bash
npm start               # Production
npm run dev             # Development (nodemon)
npm test                # Full tests
npm run test:watch      # Watch mode tests
npm run test:coverage   # Coverage report
```

## Containerization and Deployment

The application is ready for deployment using Docker with a Node.js Alpine base image. The container exposes port 3001 by default and is optimized for production environments.
