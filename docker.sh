set -e

handle_error() {
  echo "Packaging failure"
  exit 1
}

trap handle_error ERR

v=''

while [[ ! $v ]]
do
  read -p "Please enter the version number of the package: " v
done

echo Packaging path：$1:$v

cd docker
npm run build
docker build -t $1:$v .
docker push $1:$v

echo Packaged successfully
echo Packaged path: $1
echo Packaged version: $v
echo Packing completion time: $(date +"%Y年%m月%d日 %H时%M分%S秒")

exit
