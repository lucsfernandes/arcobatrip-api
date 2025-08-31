# Usar imagem oficial do Node.js LTS Alpine para menor tamanho
FROM node:18-alpine AS base

# Instalar dumb-init para gerenciamento de processos
RUN apk add --no-cache dumb-init

# Criar diretório da aplicação
WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Estágio de desenvolvimento/build
FROM base AS development

# Instalar todas as dependências (incluindo devDependencies)
RUN npm ci

# Copiar código fonte
COPY . .

# Compilar TypeScript para JavaScript
RUN npm run build 2>/dev/null || npx tsc

# Estágio de produção
FROM base AS production

# Definir ambiente de produção
ENV NODE_ENV=production

# Instalar apenas dependências de produção
RUN npm ci --only=production && npm cache clean --force

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs && \
    adduser -S arcobatrip -u 1001

# Copiar arquivos compilados do estágio de build
COPY --from=development --chown=arcobatrip:nodejs /app/dist ./dist
COPY --from=development --chown=arcobatrip:nodejs /app/package*.json ./

# Mudar para usuário não-root
USER arcobatrip

# Expor porta da aplicação
EXPOSE 3000

# Definir variáveis de ambiente padrão
ENV PORT=3000

# Usar dumb-init para gerenciar processos
ENTRYPOINT ["dumb-init", "--"]

# Comando para iniciar a aplicação
CMD ["node", "dist/server.js"]
