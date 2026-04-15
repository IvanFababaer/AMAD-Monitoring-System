# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.


# AgriTreeTracker 🌳📍

**AgriTreeTracker** is a web-based management system designed to track and monitor tree planting activities across the MIMAROPA region. It provides real-time geospatial data visualization and analytics to help foresters, LGUs, and community stakeholders manage reforestation efforts effectively.

![Project Status: Completed](https://img.shields.io/badge/Status-Completed-success)
![License](https://img.shields.io/badge/license-MIT-blue)

## 📋 Table of Contents
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Usage](#-usage)
- [Screenshots](#-screenshots)

## 🌟 Key Features

* **Interactive Mapping:** Visualize tree locations and density across Mindoro, Marinduque, Romblon, and Palawan using **Leaflet.js**.
* **Data Dashboard:** View statistical summaries and growth trends with dynamic charts powered by **Chart.js**.
* **CRUD Operations:** Full capability to add, update, and manage tree records and planter data.
* **MVC Architecture:** Clean and organized code structure for maintainability and scalability.

## 🛠 Tech Stack

**Backend**
* **Runtime:** Node.js
* **Framework:** Express.js (MVC Pattern)
* **Database:** MySQL
* **Templating Engine:** EJS

**Frontend**
* HTML5 / CSS3
* JavaScript (ES6+)
* **Libraries:** Leaflet.js (Maps), Chart.js (Analytics)

## ⚙️ Prerequisites

Before you begin, ensure you have the following installed on your machine:
* [Node.js](https://nodejs.org/) (v14 or higher)
* [MySQL](https://www.mysql.com/)

## 🚀 Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/yourusername/agri-tree-tracker.git](https://github.com/yourusername/agri-tree-tracker.git)
    cd agri-tree-tracker
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Set up the Database**
    * Create a new MySQL database named `agritreetracker` (or your preferred name).
    * Import the `database.sql` file located in the `/db` folder to set up tables and initial seed data.

4.  **Start the Server**
    ```bash
    npm start
    # OR for development with nodemon
    npm run dev
    ```

5.  **Access the App**
    Open your browser and navigate to `http://localhost:3000`.

## 🔧 Configuration

Create a `.env` file in the root directory and add your database credentials:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=agritreetracker