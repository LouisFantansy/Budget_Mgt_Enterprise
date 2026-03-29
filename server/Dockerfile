# 后端 Dockerfile
FROM node:20 AS builder

WORKDIR /app

# 安装构建依赖
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 安装依赖（需要 devDependencies 用于构建）
RUN npm ci && npm cache clean --force

# 复制 prisma schema
COPY src/prisma/schema.prisma ./prisma/schema.prisma

# 复制源代码
COPY . .

# 生成 Prisma 客户端
RUN npx prisma generate

# 构建应用
RUN npm run build

# 生产镜像
FROM node:20-slim

WORKDIR /app

# 安装运行时依赖（包括 OpenSSL）
RUN apt-get update && apt-get install -y \
    openssl \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装全部依赖（保留 devDependencies 用于种子数据）
RUN npm ci --include=dev && npm cache clean --force

# 从 builder 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/src/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/ts-node ./node_modules/ts-node
COPY --from=builder /app/node_modules/.bin/ts-node ./node_modules/.bin/ts-node

# 暴露端口
EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# 启动应用
CMD ["node", "dist/main.js"]
