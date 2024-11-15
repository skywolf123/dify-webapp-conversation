# 这里安装node_modules
FROM --platform=linux/amd64 node:20-alpine AS deps

WORKDIR /app

COPY package*.json ./

RUN yarn install

# 这里是Next.js打包输出的版本
FROM --platform=linux/amd64 node:20-alpine AS builder

WORKDIR /app

# 拷贝来自deps阶段的/app/node_modules文件
COPY --from=deps /app/node_modules ./node_modules

COPY . .

RUN yarn build

# 检查构建输出
RUN ls -la /app/.next

# 这里就是打包完之后运行的版本
FROM --platform=linux/amd64 node:20-alpine AS runner
WORKDIR /app

# 复制 standalone 输出
COPY --from=builder /app/.next/standalone ./

# 复制 public 和 .next/static 文件夹
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
