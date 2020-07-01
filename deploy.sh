docker build -t panospd/fibo-client:latest -t panospd/fibo-client:$SHA -f ./client/Dockerfile ./client
docker build -t panospd/fibo-server:latest -t panospd/fibo-server:$SHA -f ./server/Dockerfile ./server
docker build -t panospd/fibo-worker:latest -t panospd/fibo-worker:$SHA -f ./worker/Dockerfile ./worker

docker push panospd/fibo-client:latest
docker push panospd/fibo-client:$SHA

docker push panospd/fibo-server:latest
docker push panospd/fibo-server:$SHA

docker push panospd/fibo-worker:latest
docker push panospd/fibo-worker:$SHA

kubectl apply -f k8s
kubectl set image deployments/server-deployment server=panospd/fibo-server:$SHA
kubectl set image deployments/client-deployment client=panospd/fibo-client:$SHA
kubectl set image deployments/worker-deployment worker=panospd/fibo-worker:$SHA