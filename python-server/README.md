## Getting Started

Clone the repo:

```bash
cd python-server
```

Then run the development server:

```bash
python -m venv venv
```
Create the virtual environment:

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
