# 🔐 GitHub Secrets - Configuração para Deploy Automatizado

## 📋 Secrets necessários para a Pipeline

### **🐳 Docker Hub**
| Secret | Valor | Descrição |
|--------|-------|-----------|
| `DOCKERHUB_USER` | `seu_usuario` | Usuário do DockerHub |
| `DOCKERHUB_PASS` | `sua_senha` | Senha/Token do DockerHub |

### **🌐 Portainer API**
| Secret | Valor | Descrição |
|--------|-------|-----------|
| `PORTAINER_URL` | `https://portainer.seudominio.com` | URL do Portainer (sem barra final) |
| `PORTAINER_USER` | `admin` | Usuário admin do Portainer |
| `PORTAINER_PASS` | `sua_senha_portainer` | Senha do Portainer |
| `PORTAINER_ENDPOINT_ID` | `1` | ID do endpoint (geralmente 1) |

### **🗄️ Banco de Dados**
| Secret | Valor | Descrição |
|--------|-------|-----------|
| `TYPEORM_HOST` | `postgres.seudominio.com` | Host do PostgreSQL |
| `TYPEORM_PORT` | `5432` | Porta do PostgreSQL |
| `TYPEORM_USERNAME` | `arcobatrip_user` | Usuário do banco |
| `TYPEORM_PASSWORD` | `senha_super_segura` | Senha do banco |
| `TYPEORM_DATABASE` | `arcobatrip` | Nome do banco |
| `TYPEORM_SYNC` | `false` | Sincronização (sempre false) |
| `TYPEORM_SSLMODE` | `require` | Modo SSL (require/prefer/disable) |

## 🔍 Como descobrir o PORTAINER_ENDPOINT_ID

### **Método 1: Via Interface**
1. Acesse seu Portainer
2. Vá em **Endpoints**
3. Veja o ID do seu endpoint (geralmente é `1`)

### **Método 2: Via API**
```bash
# Fazer login
curl -X POST "https://seu-portainer.com/api/auth" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua_senha"}'

# Listar endpoints (use o JWT retornado acima)
curl -X GET "https://seu-portainer.com/api/endpoints" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

## 📝 Como adicionar os Secrets no GitHub

### **Passo a passo:**
1. Vá para seu repositório no GitHub
2. Clique em **Settings**
3. No menu lateral, clique em **Secrets and variables** → **Actions**
4. Clique em **New repository secret**
5. Adicione cada secret da lista acima

### **⚠️ Importante:**
- **Nunca** commite senhas no código
- Use senhas **fortes** para produção
- **TYPEORM_SYNC** deve ser sempre `false` em produção
- Teste a conexão com Portainer antes de configurar

## 🚀 Fluxo da Pipeline Automatizada

### **1. Build & Push**
- Compila a aplicação TypeScript
- Cria imagem Docker otimizada
- Faz push para DockerHub

### **2. Deploy via Portainer API**
- Conecta na API do Portainer
- Verifica se stack existe
- **Se existe**: Atualiza com nova imagem
- **Se não existe**: Cria novo stack
- Configura todas as variáveis de ambiente
- Aplica labels do Traefik

### **3. Verificação**
- Stack é criado/atualizado automaticamente
- Container baixa nova imagem
- Aplicação fica disponível via Traefik

## ✅ Vantagens da Automação

- ✅ **Zero downtime**: Atualização sem parar serviço
- ✅ **Rollback fácil**: Pelo Portainer se necessário  
- ✅ **Logs centralizados**: Via Portainer interface
- ✅ **Monitoramento**: Healthcheck automático
- ✅ **Segurança**: Senhas via secrets, não expostas

## 🔧 Troubleshooting

### **Erro de autenticação Portainer**
- Verifique `PORTAINER_URL`, `PORTAINER_USER`, `PORTAINER_PASS`
- Teste login manual na interface

### **Endpoint não encontrado**
- Verifique `PORTAINER_ENDPOINT_ID`
- Liste endpoints via API

### **Stack não atualiza**
- Verifique logs da pipeline
- Confirme se imagem foi enviada para DockerHub
- Teste API do Portainer manualmente
