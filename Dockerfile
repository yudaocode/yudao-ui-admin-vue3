# 构建阶段
FROM registry.cn-hangzhou.aliyuncs.com/one-registry/node:latest AS build-stage

# 设置工作目录
WORKDIR /app

# 复制 package 文件并安装依赖
COPY package*.json ./
COPY pnpm-lock.yaml ./
# 设置国内源
RUN npm config set registry https://registry.npmmirror.com
RUN npm install -g pnpm
# 设置国内源
RUN pnpm config set registry https://registry.npmmirror.com
RUN pnpm install

# 复制所有源代码
COPY . .
RUN pnpm run build:prod

# 生产阶段
FROM registry.cn-hangzhou.aliyuncs.com/one-registry/nginx:latest

# 将前端构建输出复制到 Nginx 默认的 html 目录
COPY --from=build-stage /app/dist-prod /html

# 复制自定义的 Nginx 配置文件
COPY docker_nginx.conf /etc/nginx/nginx.conf

# 暴露端口
EXPOSE 80

# 启动 Nginx 服务
CMD ["nginx", "-g", "daemon off;"]
