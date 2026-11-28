FROM node:22-slim

WORKDIR /app

COPY package.json package-lock.json ./
# O npm pula em silencio dependencias opcionais que falham no download (como o
# binario nativo do Rolldown, usado pelo Vite); importar o Rolldown aqui faz o
# build falhar na hora, em vez de gerar uma imagem que quebra ao subir.
RUN npm ci && node --input-type=module -e "await import('rolldown')"

COPY . .

EXPOSE 5173

# --host 0.0.0.0 para o Vite aceitar conexoes vindas de fora do container.
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173", "--strictPort"]
