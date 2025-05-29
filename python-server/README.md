## Getting Started
Clone the repo:

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
