# 🐳 Configuração do Portainer Stack - Arcobatrip API

## 📋 Passo a passo para criar o Stack no Portainer

### 1. **Acesse o Portainer**
- Entre no seu Portainer: `https://seu-portainer.com`
- Faça login com suas credenciais

### 2. **Criar novo Stack**
- Vá para **Stacks** no menu lateral
- Clique em **+ Add stack**
- Nome do stack: `arcobatrip-api`

### 3. **Configurar o Stack**
- Selecione **Web editor**
- Copie e cole o conteúdo do arquivo `portainer-stack.yml`

### 4. **Configurar Variáveis de Ambiente**
Adicione as seguintes variáveis na seção **Environment variables**:

| Nome | Valor | Descrição |
|------|-------|-----------|
| `DOCKERHUB_USER` | `seu_usuario_dockerhub` | Usuário do DockerHub |
| `TYPEORM_HOST` | `seu_host_postgres` | Host do PostgreSQL |
| `TYPEORM_PORT` | `5432` | Porta do PostgreSQL |
| `TYPEORM_USERNAME` | `seu_usuario_db` | Usuário do banco |
| `TYPEORM_PASSWORD` | `sua_senha_db` | Senha do banco |
| `TYPEORM_DATABASE` | `arcobatrip` | Nome do banco |
| `TYPEORM_SYNC` | `false` | Sincronização (sempre false em produção) |

### 5. **Deploy do Stack**
- Clique em **Deploy the stack**
- Aguarde o download da imagem e inicialização do container

## ✅ **Verificações pós-deploy**

### **Container Status**
- Verifique se o container está **Running**
- Logs devem mostrar: `Server up and running on port 3000...`

### **Rede**
- Container deve estar conectado à rede `arcobatroxnet`
- Traefik deve detectar automaticamente as labels

### **Acesso**
- API disponível em: `https://arcobatrip.arcobatrox.com.br/api`
- Healthcheck em: `https://arcobatrip.arcobatrox.com.br/api/health`

## 🔧 **Troubleshooting**

### **Container não inicia**
1. Verifique os logs do container
2. Confirme se todas as variáveis de ambiente estão definidas
3. Teste conexão com o banco de dados

### **Traefik não detecta o serviço**
1. Verifique se as labels estão corretas
2. Confirme se a rede `arcobatroxnet` existe
3. Reinicie o container se necessário

### **Erro de banco de dados**
1. Verifique se o PostgreSQL está rodando
2. Confirme credenciais de conexão
3. Teste conectividade de rede

## 📝 **Notas importantes**

- **TYPEORM_SYNC=false**: Nunca use `true` em produção
- **Healthcheck**: Configurado para verificar a saúde da aplicação
- **Restart policy**: `unless-stopped` para alta disponibilidade
- **Labels Traefik**: Configuradas para SSL automático

## 🔄 **Atualizações**

Para atualizar a aplicação:
1. Faça push da nova imagem no DockerHub
2. No Portainer, vá em **Stacks** → **arcobatrip-api**
3. Clique em **Update the stack**
4. Marque **Re-pull image**
5. Clique em **Update**
