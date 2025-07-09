# 上海港盛东部署 121服务器密码 hb56SDGSwmh121
# rm -rf web.tar
# ng build --configuration=ssict-prod
# docker build -f Dockerfile_ssict -t web .
# docker save -o web.tar web
# scp web.tar root@10.16.113.121:/opt/diyms/images
# rm -rf web.tar



# 使用旧版本Dockerfile，需要预先构建Angular应用

# 设置错误时退出
set -e

echo "开始构建 Angular 应用..."
ng build --configuration=production

# 验证构建结果
if [ ! -d "dist/admin-web" ]; then
  echo "错误: Angular 构建失败，dist/admin-web 目录不存在"
  exit 1
fi

echo "开始构建 Docker 镜像..."
docker build -f Dockerfile -t web .

echo "构建完成: web 镜像已创建"
# docker tag web 10.2.4.54/diyms/web
# docker tag web 10.2.4.54/diyms/web:v1.9.4
# docker login 10.2.4.54 -u storageai -p Storageai123
# docker push 10.2.4.54/diyms/web:v1.9.4

# 上海港明东新服务器部署 35^QF6nVQV%X
# rm -rf web.tar
# ng build --configuration=ssict-prod
# docker build -f Dockerfile -t web .
# docker save -o web.tar web
# scp web.tar root@10.23.12.73:/opt/diyms/images
# rm -rf web.tar


###构建arm64平台架构打包命令
# docker buildx build -f Dockerfile -t web --platform=linux/arm64 . --load
# docker buildx build -f Dockerfile -t web --platform=linux/amd64 . --load

# 外二
# ng build --configuration=ssict-prod
# docker build -f Dockerfile -t web .
# docker save -o web.tar web
# scp web.tar root@172.16.53.27:/opt/diyms/images  


# ng build --configuration=lct-dev
# scp web.tar njp@192.168.56.162:/opt/diyms/images
# 密码： k+aBBg98