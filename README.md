# 🔐 SafeWatch

**SafeWatch** is an AI-powered, location-aware crime reporting web platform that bridges the gap between citizens and law enforcement. It streamlines traditional reporting with advanced features like image analysis, real-time GPS, and predictive analytics.

---

## 🚀 Key Features

### 👥 Dual User Modes
- **User Mode**:  
  - Submit **Emergency Reports** (quick, minimal fields).  
  - Submit **Normal Reports** (detailed, with media evidence).
- **Admin Mode**:  
  - Law enforcement dashboard to **verify**, **track**, and **manage** reports.

### 🧠 AI-Powered Media Analysis
- Uses Florence-2 model (available on HuggingFace) via transformers to provide evidence analysis and ocr extraction.

### 🚫 False Complaint Filtering
- Detects and filters outdated or suspicious uploads using AI and metadata checks.

### 📍 Geo-Tagged Reporting
- Automatically captures the crime location via **GPS**.
- Routes reports to the **nearest police station**.
- Provides users with:
  - **Tracking ID**
  - **Officer details**
  - **Station contact info**

### 🔎 AI Crime Prediction
- Uses historical data and **machine learning** to:
  - Generate **crime heatmaps**
  - Send **predictive alerts**
- Enables smarter **police deployment** and **preemptive patrolling**.

---

## 🛠️ Tech Stack
- **Frontend**: [Next.js]
- **Backend**: [FastAPI]
- **AI Analysis**: [Florence-2 by Microsoft (through transformers)]
- **Database**: [PostgreSQL via Supabase]
- **Geolocation**: HTML5 Geolocation API / Google Maps API


## Getting Started

## Frontend

Clone the repo:

```bash
git clone <repository_name>
cd <repository_name>
npm install
```

Then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

## For backend:

```bash
cd python-server
```

Create the virtual environment:

```bash
python -m venv venv
```
Activate the virtual environment

``` bash
source venv/bin/activate (Linux)

cd venv/Scripts (Windows)
activate
```

```bash
pip install -r requirements.txt
```
Run the server:

```bash

uvicorn server:app --port 5000 --reload

```
For the model server:

- Run the model_server.py

``` bash
cd model
uvicorn model_server:app --port 8080 --reload
```



