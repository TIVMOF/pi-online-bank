# Online mobile bank app for Proper Invest Bank

## The repository includes:
1. The UI of the app
2. The app
3. The server part of the app
4. Some additional data for the app

## Model

## Application
## Build

	docker build -t bank-backend .
 
## PULL

	docker pull ghcr.io/tivmof/bank-backend:latest

## Run

	docker run --name online_bank -d -p 8080:8080 ghcr.io/tivmof/bank-backend:latest
 
## Clean

	docker rm bank-backend

   
