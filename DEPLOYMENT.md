# Friend.ly Deployment Guide

This guide covers deployment strategies for the Friend.ly music guessing game across different environments.

## 🚀 Quick Deployment Options

### Option 1: One-Click Deploy (Recommended)

[![Deploy with Railway](https://railway.app/button.svg)](https://railway.app/template/your-template-id)
[![Deploy to Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-repo)

### Option 2: Manual Deployment

Follow the step-by-step guides below for specific platforms.

## 📋 Prerequisites

- GitHub repository with your code
- Domain name (optional)
- API keys (YouTube Data API v3, OpenAI API)
- Database hosting (PostgreSQL)
- Redis hosting

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend

```bash
cd client
npm run build
```

### 2. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

### 3. Environment Variables

In Vercel dashboard, add:
```
REACT_APP_SERVER_URL=https://your-backend-url.com
```

### 4. Custom Domain (Optional)

1. Go to Vercel dashboard
2. Select your project
3. Go to Settings → Domains
4. Add your domain
5. Configure DNS records

## 🖥 Backend Deployment (Railway)

### 1. Prepare Backend

```bash
cd server
npm run build
```

### 2. Deploy to Railway

```bash
# Install Railway CLI
npm i -g @railway/cli

# Login to Railway
railway login

# Initialize project
railway init

# Deploy
railway up
```

### 3. Environment Variables

In Railway dashboard, add:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/db
REDIS_URL=redis://host:port
JWT_SECRET=your-super-secret-jwt-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://your-frontend-url.com
PORT=5000
```

### 4. Database Setup

Railway provides PostgreSQL and Redis services:

1. Add PostgreSQL service
2. Add Redis service
3. Copy connection strings to environment variables

## 🐳 Docker Deployment

### 1. Production Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: friendly
      POSTGRES_USER: friendly
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  server:
    build: 
      context: ./server
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://friendly:${DB_PASSWORD}@postgres:5432/friendly
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
      - YOUTUBE_API_KEY=${YOUTUBE_API_KEY}
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - CLIENT_URL=${CLIENT_URL}
    depends_on:
      - postgres
      - redis
    restart: unless-stopped
    ports:
      - "5000:5000"

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./client/build:/usr/share/nginx/html
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - server
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 2. Production Dockerfile

```dockerfile
# server/Dockerfile.prod
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS production

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

### 3. Deploy with Docker

```bash
# Build and start services
docker-compose -f docker-compose.prod.yml up -d

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

## ☁️ Cloud Platform Deployments

### AWS Deployment

#### 1. ECS with Fargate

```json
{
  "family": "friendly-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "friendly-backend",
      "image": "your-account.dkr.ecr.region.amazonaws.com/friendly-backend:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:ssm:region:account:parameter/friendly/database-url"
        }
      ]
    }
  ]
}
```

#### 2. RDS PostgreSQL Setup

```bash
# Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier friendly-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --engine-version 15.4 \
  --master-username friendly \
  --master-user-password your-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-12345678
```

#### 3. ElastiCache Redis Setup

```bash
# Create Redis cluster
aws elasticache create-cache-cluster \
  --cache-cluster-id friendly-redis \
  --cache-node-type cache.t3.micro \
  --engine redis \
  --num-cache-nodes 1
```

### Google Cloud Platform

#### 1. Cloud Run Deployment

```yaml
# cloud-run.yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: friendly-backend
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: "10"
    spec:
      containers:
      - image: gcr.io/your-project/friendly-backend:latest
        ports:
        - containerPort: 5000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: friendly-secrets
              key: database-url
```

#### 2. Deploy to Cloud Run

```bash
# Build and push image
gcloud builds submit --tag gcr.io/your-project/friendly-backend

# Deploy to Cloud Run
gcloud run deploy friendly-backend \
  --image gcr.io/your-project/friendly-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

### Azure Deployment

#### 1. Container Instances

```yaml
# azure-container-instance.yaml
apiVersion: 2021-09-01
location: eastus
name: friendly-backend
properties:
  containers:
  - name: friendly-backend
    properties:
      image: your-registry.azurecr.io/friendly-backend:latest
      ports:
      - port: 5000
        protocol: TCP
      environmentVariables:
      - name: NODE_ENV
        value: production
      - name: DATABASE_URL
        secureValue: your-database-connection-string
  osType: Linux
  restartPolicy: Always
  ipAddress:
    type: Public
    ports:
    - protocol: TCP
      port: 5000
```

## 🔧 Environment Configuration

### Development Environment

```env
# .env.development
NODE_ENV=development
DATABASE_URL=postgresql://friendly:password@localhost:5432/friendly_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=dev-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=http://localhost:3000
PORT=5000
```

### Staging Environment

```env
# .env.staging
NODE_ENV=staging
DATABASE_URL=postgresql://friendly:staging-password@staging-db:5432/friendly_staging
REDIS_URL=redis://staging-redis:6379
JWT_SECRET=staging-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://staging.friendly-game.com
PORT=5000
```

### Production Environment

```env
# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://friendly:production-password@prod-db:5432/friendly_prod
REDIS_URL=redis://prod-redis:6379
JWT_SECRET=super-secure-production-secret-key
YOUTUBE_API_KEY=your-youtube-api-key
OPENAI_API_KEY=your-openai-api-key
CLIENT_URL=https://friendly-game.com
PORT=5000
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm run setup
    
    - name: Run tests
      run: npm test
    
    - name: Build
      run: npm run build

  deploy-backend:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Railway
      uses: railway-app/railway-deploy@v1
      with:
        railway-token: ${{ secrets.RAILWAY_TOKEN }}
        service: backend

  deploy-frontend:
    needs: test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Deploy to Vercel
      uses: amondnet/vercel-action@v25
      with:
        vercel-token: ${{ secrets.VERCEL_TOKEN }}
        vercel-org-id: ${{ secrets.ORG_ID }}
        vercel-project-id: ${{ secrets.PROJECT_ID }}
        working-directory: ./client
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "18"

test:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm run setup
    - npm test
    - npm run build

deploy_backend:
  stage: deploy
  image: railway/cli:latest
  script:
    - railway login --token $RAILWAY_TOKEN
    - railway up --service backend
  only:
    - main

deploy_frontend:
  stage: deploy
  image: node:${NODE_VERSION}
  script:
    - cd client
    - npm install -g vercel
    - vercel --token $VERCEL_TOKEN --prod
  only:
    - main
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

```typescript
// Health check implementation
app.get('/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version,
      services: {
        database: await checkDatabase(),
        redis: await checkRedis(),
        youtube: await checkYouTubeAPI(),
        openai: await checkOpenAI()
      }
    };
    
    const isHealthy = Object.values(health.services).every(service => service.status === 'ok');
    res.status(isHealthy ? 200 : 503).json(health);
  } catch (error) {
    res.status(503).json({ status: 'error', message: error.message });
  }
});
```

### Monitoring Setup

#### 1. Uptime Monitoring

```yaml
# uptime-kuma.yml
version: '3.8'
services:
  uptime-kuma:
    image: louislam/uptime-kuma:1
    container_name: uptime-kuma
    volumes:
      - uptime-kuma:/app/data
    ports:
      - "3001:3001"
    restart: unless-stopped
```

#### 2. Log Aggregation

```yaml
# logging.yml
version: '3.8'
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - loki-data:/loki

  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
      - ./promtail.yml:/etc/promtail/config.yml
    depends_on:
      - loki
```

## 🔒 Security Considerations

### SSL/TLS Configuration

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name friendly-game.com;
    
    ssl_certificate /etc/ssl/certs/friendly-game.com.crt;
    ssl_certificate_key /etc/ssl/private/friendly-game.com.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Security

```bash
# Generate secure secrets
openssl rand -base64 32  # JWT secret
openssl rand -base64 16  # Session secret

# Use secrets management
aws ssm put-parameter \
  --name "/friendly/database-url" \
  --value "postgresql://..." \
  --type "SecureString"
```

## 🚨 Troubleshooting

### Common Deployment Issues

#### 1. Database Connection Issues

```bash
# Check database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check Redis connectivity
redis-cli -u $REDIS_URL ping
```

#### 2. Socket.IO Connection Issues

```typescript
// Debug Socket.IO connections
io.engine.on('connection_error', (err) => {
  console.log('Connection error:', err.req, err.code, err.message, err.context);
});
```

#### 3. Memory Issues

```bash
# Monitor memory usage
docker stats

# Check Node.js memory
node --inspect dist/index.js
```

### Performance Optimization

#### 1. Database Optimization

```sql
-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Optimize indexes
CREATE INDEX CONCURRENTLY idx_rooms_created_at ON rooms(created_at);
```

#### 2. Redis Optimization

```bash
# Monitor Redis performance
redis-cli --latency-history -i 1

# Check memory usage
redis-cli info memory
```

## 📈 Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  server:
    deploy:
      replicas: 3
    environment:
      - REDIS_URL=redis://redis-cluster:6379
  
  nginx:
    volumes:
      - ./nginx-load-balancer.conf:/etc/nginx/nginx.conf
```

### Load Balancer Configuration

```nginx
# nginx-load-balancer.conf
upstream backend {
    server server_1:5000;
    server server_2:5000;
    server server_3:5000;
}

server {
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] DNS records configured
- [ ] Monitoring setup
- [ ] Backup strategy in place

### Post-Deployment

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Database connections working
- [ ] Socket.IO connections working
- [ ] External APIs accessible
- [ ] Performance metrics normal
- [ ] Error tracking active

### Rollback Plan

```bash
# Quick rollback script
#!/bin/bash
echo "Rolling back deployment..."

# Stop current services
docker-compose -f docker-compose.prod.yml down

# Deploy previous version
git checkout previous-stable-tag
docker-compose -f docker-compose.prod.yml up -d

# Verify rollback
curl -f http://localhost/health || exit 1

echo "Rollback completed successfully!"
```

---

This deployment guide covers the essential aspects of deploying Friend.ly to production. Choose the deployment strategy that best fits your infrastructure and requirements.


