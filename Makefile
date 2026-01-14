.PHONY: dev frontend backend

dev:
	@make -j2 frontend backend

frontend:
	cd frontend && npm run dev

backend:
	cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
