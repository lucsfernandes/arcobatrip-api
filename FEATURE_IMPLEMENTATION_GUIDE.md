# 🚀 Guia de Implementação de Features

Este guia descreve o fluxo completo para implementar uma nova feature no projeto Arcobatrip API, seguindo os princípios de Clean Architecture e DDD.

---

## 📋 Checklist Principal de Implementação

### ✅ Checklist Completo (Ordem Recomendada)

- [ ] **1. DOMÍNIO** - Criar entidade de domínio
  - [ ] Criar interface da entidade (`IMinhaEntidade.ts`)
  - [ ] Criar classe da entidade (`minhaEntidade.entity.ts`)
  
- [ ] **2. APPLICATION** - Definir casos de uso
  - [ ] Criar interface do repositório (`IMinhaEntidadeRepo.ts`)
  - [ ] Criar DTO de Request (`CreateMinhaEntidadeRequestDTO.ts`)
  - [ ] Criar DTO de Response (`CreateMinhaEntidadeResponseDTO.ts`)
  - [ ] Implementar Use Case (`CreateMinhaEntidadeUseCase.ts`)
  
- [ ] **3. INFRAESTRUTURA** - Implementação técnica
  - [ ] Criar Mapper (`MinhaEntidadeMap.ts`)
  - [ ] Implementar Repositório concreto (`MinhaEntidadeRepo.ts`)
  
- [ ] **4. PRESENTATION** - Interface HTTP
  - [ ] Criar validador Zod (`minhaEntidadePayloadValidation.ts`)
  - [ ] Criar Controller (`CreateMinhaEntidadeController.ts`)
  
- [ ] **5. MAIN** - Injeção de dependências
  - [ ] Registrar repositório na factory (`typeOrmRepoFactory.ts`)
  - [ ] Criar factory do controller (`minhaEntidadeFactory.ts`)
  
- [ ] **6. ROUTERS** - Definir rotas
  - [ ] Criar router específico (`createMinhaEntidadeRouter.ts`)
  - [ ] Criar router principal de versão (`v1MinhaEntidadeRouter.ts`)
  - [ ] Registrar nas rotas gerais (`routes.ts`)
  
- [ ] **7. DATABASE** - Persistência
  - [ ] Criar migration
  - [ ] Executar migration
  
- [ ] **8. TESTES** - Validação
  - [ ] Testar endpoint manualmente
  - [ ] Criar testes unitários
  - [ ] Criar testes de integração

---

## 🔄 Fluxo de Requisição

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Router    │ ──▶ │  Validator  │ ──▶ │ Controller  │ ──▶ │   UseCase   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
                                                                   │
                                                                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Response   │ ◀── │ Controller  │ ◀── │   Result    │ ◀── │ Repository  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
```

---

## 📂 Estrutura de Arquivos por Feature

Para uma feature chamada "MinhaEntidade", a estrutura seria:

```
src/
├── domain/entities/MinhaEntidade/
│   ├── IMinhaEntidade.ts                    # Interface do domínio
│   └── minhaEntidade.entity.ts              # Entidade TypeORM
│
├── application/usecases/minhaEntidade/
│   ├── IMinhaEntidadeRepo.ts                # Interface do repositório
│   └── create/
│       ├── CreateMinhaEntidadeRequestDTO.ts
│       ├── CreateMinhaEntidadeResponseDTO.ts
│       └── CreateMinhaEntidadeUseCase.ts
│
├── infra/
│   ├── db/mappers/
│   │   └── MinhaEntidadeMap.ts              # Mapper
│   └── repositories/
│       └── MinhaEntidadeRepo.ts             # Implementação do repo
│
├── presentation/
│   ├── controllers/MinhaEntidade/
│   │   └── CreateMinhaEntidadeController.ts
│   ├── validators/minhaEntidade/
│   │   └── minhaEntidadePayloadValidation.ts
│   └── routers/
│       ├── v1MinhaEntidadeRouter.ts
│       └── minhaEntidade/
│           └── createMinhaEntidadeRouter.ts
│
└── main/factories/minhaEntidade/
    └── minhaEntidadeFactory.ts              # Factory DI
```

---

## 📝 Checklist Detalhado por Camada

### 1️⃣ DOMÍNIO (Domain Layer)

#### ✅ Entidade de Domínio
- [ ] Criar pasta `src/domain/entities/MinhaEntidade/`
- [ ] Criar `IMinhaEntidade.ts` com a interface
  - [ ] Definir propriedades obrigatórias
  - [ ] Definir propriedades opcionais
  - [ ] Incluir campos de BaseEntity (id, createdAt, updatedAt)
- [ ] Criar `minhaEntidade.entity.ts` com a classe TypeORM
  - [ ] Adicionar decorator `@Entity("nome_tabela")`
  - [ ] Estender `BaseEntity`
  - [ ] Adicionar decorators `@Column` para cada propriedade
  - [ ] Configurar relacionamentos (`@OneToMany`, `@ManyToOne`, etc.)

---

### 2️⃣ APPLICATION (Application Layer)

#### ✅ Interface do Repositório
- [ ] Criar pasta `src/application/usecases/minhaEntidade/`
- [ ] Criar `IMinhaEntidadeRepo.ts`
  - [ ] Definir interfaces de payloads (Create, Update, etc.)
  - [ ] Definir métodos do repositório (create, findById, etc.)
  - [ ] Usar tipos do domínio nas assinaturas

#### ✅ DTOs (Data Transfer Objects)
- [ ] Criar pasta `src/application/usecases/minhaEntidade/create/`
- [ ] Criar `CreateMinhaEntidadeRequestDTO.ts`
  - [ ] Definir apenas dados necessários para criação
  - [ ] Usar tipos primitivos ou do domínio
- [ ] Criar `CreateMinhaEntidadeResponseDTO.ts`
  - [ ] Definir estrutura de resposta de sucesso
  - [ ] Incluir apenas dados que devem ser expostos

#### ✅ Use Case
- [ ] Criar `CreateMinhaEntidadeUseCase.ts`
  - [ ] Implementar interface `IUseCase<Request, Response>`
  - [ ] Injetar dependências no construtor (repositórios, serviços)
  - [ ] Implementar método `execute()`
  - [ ] Adicionar validações de regras de negócio
  - [ ] Usar `Result.ok()` para sucesso
  - [ ] Usar `Result.fail()` para erros
  - [ ] Tratar exceções com try/catch

---

### 3️⃣ INFRAESTRUTURA (Infrastructure Layer)

#### ✅ Mapper
- [ ] Criar `src/infra/db/mappers/MinhaEntidadeMap.ts`
  - [ ] Implementar método estático `toDomain()`
  - [ ] Implementar método estático `toPersistence()` (se necessário)
  - [ ] Mapear relacionamentos se houver

#### ✅ Repositório
- [ ] Criar `src/infra/repositories/MinhaEntidadeRepo.ts`
  - [ ] Implementar interface `IMinhaEntidadeRepo`
  - [ ] Injetar `Repository<MinhaEntidade>` do TypeORM
  - [ ] Implementar método `create()`
  - [ ] Implementar método `findById()`
  - [ ] Implementar outros métodos necessários
  - [ ] Usar Mapper para converter entidades
  - [ ] Tratar erros de banco de dados

---

### 4️⃣ PRESENTATION (Presentation Layer)

#### ✅ Validador
- [ ] Criar pasta `src/presentation/validators/minhaEntidade/`
- [ ] Criar `minhaEntidadePayloadValidation.ts`
  - [ ] Importar `z` do Zod
  - [ ] Definir schema de validação
  - [ ] Adicionar validações customizadas (min, max, regex, etc.)
  - [ ] Adicionar mensagens de erro personalizadas
  - [ ] Exportar schema

#### ✅ Controller
- [ ] Criar pasta `src/presentation/controllers/MinhaEntidade/`
- [ ] Criar `CreateMinhaEntidadeController.ts`
  - [ ] Estender `BaseController`
  - [ ] Injetar Use Case no construtor
  - [ ] Implementar método `executeImpl()`
  - [ ] Extrair dados do `req.body`
  - [ ] Chamar `useCase.execute()`
  - [ ] Verificar `result.isFailure`
  - [ ] Retornar resposta apropriada (ok, created, fail)

---

### 5️⃣ MAIN (Dependency Injection)

#### ✅ Repository Factory
- [ ] Editar `src/main/factories/typeOrmRepoFactory.ts`
  - [ ] Importar entidade TypeORM
  - [ ] Importar classe do repositório
  - [ ] Criar instância do repositório
  - [ ] Exportar instância

#### ✅ Controller Factory
- [ ] Criar pasta `src/main/factories/minhaEntidade/`
- [ ] Criar `minhaEntidadeFactory.ts`
  - [ ] Importar Use Case
  - [ ] Importar Controller
  - [ ] Importar repositório da factory
  - [ ] Instanciar Use Case com dependências
  - [ ] Instanciar Controller com Use Case
  - [ ] Exportar controller

---

### 6️⃣ ROUTERS (Routes Definition)

#### ✅ Router Específico
- [ ] Criar pasta `src/presentation/routers/minhaEntidade/`
- [ ] Criar `createMinhaEntidadeRouter.ts`
  - [ ] Importar `Router` do Express
  - [ ] Importar validador Zod
  - [ ] Importar controller da factory
  - [ ] Criar instância do Router
  - [ ] Definir rota POST/GET/etc com validação
  - [ ] Chamar `controller.execute(req, res)`
  - [ ] Exportar router

#### ✅ Router Principal
- [ ] Criar `src/presentation/routers/v1MinhaEntidadeRouter.ts`
  - [ ] Importar routers específicos
  - [ ] Criar router principal
  - [ ] Registrar routers específicos com `.use()`
  - [ ] Exportar router

#### ✅ Registrar nas Rotas Gerais
- [ ] Editar `src/presentation/middlewares/routes.ts`
  - [ ] Importar router principal
  - [ ] Adicionar `router.use('/api/v1', v1MinhaEntidadeRouter)`

---

### 7️⃣ DATABASE (Persistence Layer)

#### ✅ Migration
- [ ] Executar comando: `npm run typeorm migration:create src/infra/db/migrations/CreateMinhaEntidade`
- [ ] Editar arquivo de migration gerado
  - [ ] Implementar método `up()`
  - [ ] Criar tabela com `createTable()`
  - [ ] Definir colunas (id, propriedades, timestamps)
  - [ ] Definir chaves primárias
  - [ ] Definir chaves estrangeiras (se houver)
  - [ ] Definir índices (se necessário)
  - [ ] Implementar método `down()`
  - [ ] Implementar rollback (dropTable, etc.)
- [ ] Executar migration: `npm run typeorm migration:run`
- [ ] Verificar no banco de dados

---

### 8️⃣ TESTES (Testing)

#### ✅ Testes Unitários
- [ ] Criar `tests/unit/usecases/minhaEntidade/CreateMinhaEntidadeUseCase.test.ts`
  - [ ] Criar mock do repositório
  - [ ] Testar caso de sucesso
  - [ ] Testar validações de negócio
  - [ ] Testar casos de erro
  - [ ] Testar Result.ok e Result.fail

#### ✅ Testes de Integração
- [ ] Criar `tests/integration/minhaEntidade/minhaEntidade.integration.test.ts`
  - [ ] Configurar banco de teste
  - [ ] Testar endpoint completo
  - [ ] Testar validações de payload
  - [ ] Testar respostas HTTP
  - [ ] Limpar banco após testes

#### ✅ Testes Manuais
- [ ] Testar com Postman/Insomnia
- [ ] Verificar validações Zod
- [ ] Verificar persistência no banco
- [ ] Verificar logs
- [ ] Verificar tratamento de erros

---

## 🎯 Ordem de Implementação Recomendada

```
1. DOMÍNIO (Entidade)
   ↓
2. APPLICATION (Interface Repo + DTOs + Use Case)
   ↓
3. INFRAESTRUTURA (Mapper + Repositório)
   ↓
4. PRESENTATION (Validador + Controller)
   ↓
5. MAIN (Factories)
   ↓
6. ROUTERS (Rotas)
   ↓
7. DATABASE (Migration)
   ↓
8. TESTES (Unitários + Integração)
```

---

## 📌 Convenções do Projeto

### Nomenclatura
- **Entidades**: PascalCase singular (ex: `Trip`, `Participant`)
- **Interfaces**: PascalCase com prefixo `I` (ex: `ITrip`, `ITripRepo`)
- **Use Cases**: PascalCase com sufixo `UseCase` (ex: `CreateTripUseCase`)
- **Controllers**: PascalCase com sufixo `Controller` (ex: `CreateTripController`)
- **DTOs**: PascalCase com sufixo `DTO` (ex: `CreateTripRequestDTO`)
- **Factories**: camelCase com sufixo `Factory` (ex: `tripFactory`)
- **Routers**: camelCase com sufixo `Router` (ex: `createTripRouter`)

### Estrutura de Pastas
- Uma pasta por entidade em cada camada
- Separar operações CRUD em subpastas (create/, update/, delete/, etc.)
- Agrupar arquivos relacionados

### Padrões de Código
- Sempre usar interfaces para contratos
- Sempre usar Result Pattern nos Use Cases
- Sempre estender BaseController nos controllers
- Sempre usar validação Zod nos routers
- Sempre usar TypeORM para persistência
- Sempre usar Mappers para conversão de dados

---

## 🔍 Exemplo Prático: Feature "Comentário em Atividade"

### Requisito
Permitir que participantes adicionem comentários em atividades de uma viagem.

### Checklist Aplicado
- [x] 1. Criar `IComment.ts` e `comment.entity.ts`
- [x] 2. Criar `ICommentRepo.ts`
- [x] 3. Criar `CreateCommentRequestDTO.ts` e `CreateCommentResponseDTO.ts`
- [x] 4. Criar `CreateCommentUseCase.ts`
- [x] 5. Criar `CommentMap.ts`
- [x] 6. Criar `CommentRepo.ts`
- [x] 7. Criar `commentPayloadValidation.ts`
- [x] 8. Criar `CreateCommentController.ts`
- [x] 9. Registrar em `typeOrmRepoFactory.ts`
- [x] 10. Criar `commentFactory.ts`
- [x] 11. Criar `createCommentRouter.ts`
- [x] 12. Criar `v1CommentRouter.ts`
- [x] 13. Registrar em `routes.ts`
- [x] 14. Criar migration `CreateComment`
- [x] 15. Executar migration
- [x] 16. Testar endpoint

---

## 🚨 Pontos de Atenção

### ⚠️ Evite
- ❌ Pular camadas (ex: chamar repositório direto do controller)
- ❌ Colocar lógica de negócio no controller
- ❌ Usar entidades do TypeORM na camada de domínio
- ❌ Expor detalhes de implementação nas interfaces
- ❌ Esquecer validações de negócio no Use Case
- ❌ Esquecer tratamento de erros

### ✅ Sempre
- ✅ Seguir o fluxo das camadas (Presentation → Application → Domain → Infrastructure)
- ✅ Usar injeção de dependências
- ✅ Usar interfaces para contratos
- ✅ Validar dados de entrada (Zod + Regras de Negócio)
- ✅ Retornar Result Pattern dos Use Cases
- ✅ Logar erros apropriadamente
- ✅ Escrever testes

---

## 📚 Recursos Adicionais

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Documentação completa da arquitetura
- [README.md](./README.md) - Instruções de setup e uso
- [TypeORM Documentation](https://typeorm.io/)
- [Zod Documentation](https://zod.dev/)
- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Última atualização**: Janeiro 2026
