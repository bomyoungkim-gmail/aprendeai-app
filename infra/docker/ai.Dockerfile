FROM python:3.12-slim
WORKDIR /app
COPY services/ai/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/ai/ .
EXPOSE 8000
